import type { SupabaseClient } from "@supabase/supabase-js"

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
