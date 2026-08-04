import type { SupabaseClient } from "@supabase/supabase-js"
import emailjs from "@emailjs/nodejs"

type NotifyParams = {
  userId: string
  packageId?: string | null
  title: string
  body: string
}

// Creates an in-app notification row for the user, and sends a real email
// through EmailJS if an administrator has configured EmailJS credentials on
// the /admin/settings page (stored in public.email_settings). Until those
// credentials are entered, this silently falls back to in-app notifications
// only - no code changes or redeploys are needed once the admin fills in
// the settings form.
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
      .select("emailjs_service_id, emailjs_template_id, emailjs_public_key, emailjs_private_key")
      .eq("id", 1)
      .maybeSingle()

    if (!settings?.emailjs_service_id || !settings?.emailjs_template_id || !settings?.emailjs_public_key) {
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

    await emailjs.send(
      settings.emailjs_service_id,
      settings.emailjs_template_id,
      {
        to_email: profile.email,
        to_name: profile.full_name || "",
        subject: title,
        message: body,
      },
      {
        publicKey: settings.emailjs_public_key,
        privateKey: settings.emailjs_private_key || undefined,
      }
    )
    console.log(`[email sent] to ${profile.email}: ${title}`)
  } catch (err) {
    console.error("Failed to send email notification:", err)
  }
}
