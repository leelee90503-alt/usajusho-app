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

// Optional bilingual override for the outgoing email only - the in-app
// notification row (title/body) is left as-is (Japanese), only the email
// subject/HTML sent via Resend is swapped for this when present.
type EmailOverride = { subject: string; bodyHtml: string }

async function sendEmailNotification(
  supabase: SupabaseClient,
  userId: string,
  title: string,
  body: string,
  emailOverride?: EmailOverride
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

    const subject = emailOverride?.subject ?? title
    const html = emailOverride
      ? `<p>${greeting}${emailOverride.bodyHtml}</p>`
      : `<p>${greeting}${body}</p>`

    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${settings.resend_api_key}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "USAJUSHO <info@usajusho.com>",
        to: profile.email,
        subject,
        html,
      }),
    })

    if (!res.ok) {
      const errText = await res.text()
      console.error("Failed to send email notification via Resend:", res.status, errText)
      return
    }

    console.log(`[email sent] to ${profile.email}: ${subject}`)
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
//
// The in-app notification (title/body) stays Japanese-only, matching the
// rest of the admin dashboard. The email sent to admins is bilingual
// (Japanese + English, JP first) since admins have asked to be able to
// read the alert without necessarily reading Japanese - titleEn/bodyEn are
// required so every admin-facing notification stays bilingual by default.
export async function notifyAdmins(params: {
  title: string
  body: string
  titleEn: string
  bodyEn: string
  packageId?: string | null
}) {
  const { title, body, titleEn, bodyEn, packageId } = params
  const emailOverride = {
    subject: `${title} / ${titleEn}`,
    bodyHtml: `${body}<br/><br/>—<br/><br/>${bodyEn}`,
  }

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
      await sendEmailNotification(adminSupabase, admin.id, title, body, emailOverride)
    })
  )
}

