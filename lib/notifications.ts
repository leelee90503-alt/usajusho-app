import type { SupabaseClient } from "@supabase/supabase-js"
import { createAdminClient } from "@/lib/supabase/admin"

type NotifyParams = {
  userId: string
  packageId?: string | null
  title: string
  body: string
}

// Creates an in-app notification row for the user, and sends a real email
// through Resend if an administrator has entered a Resend API key on the
// /admin/settings page (stored in public.email_settings). Until that key is
// entered, this silently falls back to in-app notifications only - no code
// changes or redeploys are needed once the admin fills in the settings form.
export async function notifyUser(supabase: SupabaseClient, params: NotifyParams) {
  const { userId, packageId, title, body } = params

  const { error } = await supabase.from("notifications").insert({
    user_id: userId,
    package_id: packageId ?? null,
    title,
    body,
  })
  if (error) {
    console.error("Failed to create notification:", error.message)
  }

  await sendEmailNotification(supabase, userId, title, body)
}

async function sendEmailNotification(
  supabase: SupabaseClient,
  userId: string,
  title: string,
  body: string
) {
  try {
    const { data: settings } = await supabase
      .from("email_settings")
      .select("resend_api_key")
      .eq("id", 1)
      .maybeSingle()

    if (!settings?.resend_api_key) {
      console.log(`[email not configured] would notify user ${userId}: ${title} - ${body}`)
      return
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("email, full_name")
      .eq("id", userId)
      .single()

    if (!profile?.email) {
      console.log(`[no email on file] could not email user ${userId}: ${title} - ${body}`)
      return
    }

    const greeting = profile.full_name ? `${profile.full_name} 様,<br/><br/>` : ""

    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${settings.resend_api_key}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "USAJUSHO <info@usajusho.com>",
        to: profile.email,
        subject: title,
        html: `<p>${greeting}${body}</p>`,
      }),
    })

    if (!res.ok) {
      const errText = await res.text()
      console.error("Failed to send email notification via Resend:", res.status, errText)
      return
    }

    console.log(`[email sent] to ${profile.email}: ${title}`)
  } catch (err) {
    console.error("Failed to send email notification:", err)
  }
}

// Notifies every admin user (in-app notification + email) about a
// customer-initiated event: a new package pre-declaration, a new
// purchase-agency request, a new shipment request, or a shipping payment.
// Customer-facing server actions run under the customer's own RLS-scoped
// session, which cannot read public.email_settings or list other users'
// profiles - so this uses the service-role admin client instead, which
// bypasses RLS entirely and works regardless of who is calling it.
//
// Requires SUPABASE_SERVICE_ROLE_KEY to be set (see lib/supabase/admin.ts).
// Until it is, this logs a warning and no-ops rather than breaking the
// customer's action.
export async function notifyAdmins(params: {
  title: string
  body: string
  packageId?: string | null
}) {
  const { title, body, packageId } = params

  let adminSupabase: SupabaseClient
  try {
    adminSupabase = createAdminClient()
  } catch (err) {
    console.warn(
      "notifyAdmins: SUPABASE_SERVICE_ROLE_KEY not configured yet, skipping admin notification:",
      err instanceof Error ? err.message : err
    )
    return
  }

  const { data: admins, error: adminsError } = await adminSupabase
    .from("profiles")
    .select("id")
    .eq("is_admin", true)

  if (adminsError) {
    console.error("Failed to look up admin profiles:", adminsError.message)
    return
  }

  if (!admins?.length) {
    console.log("notifyAdmins: no admin profiles found")
    return
  }

  await Promise.all(
    admins.map(async (admin) => {
      const { error } = await adminSupabase.from("notifications").insert({
        user_id: admin.id,
        package_id: packageId ?? null,
        title,
        body,
      })
      if (error) {
        console.error("Failed to create admin notification:", error.message)
      }
      await sendEmailNotification(adminSupabase, admin.id, title, body)
    })
  )
}

