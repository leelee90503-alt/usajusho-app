import type { SupabaseClient } from "@supabase/supabase-js"

type NotifyParams = {
  userId: string
  packageId?: string | null
  title: string
  body: string
}

// Creates an in-app notification row for the user, and stubs out an email send.
//
// TODO: Wire up a real email provider (e.g. Resend, SendGrid, Postmark) once
// credentials are available. Email delivery needs the user's email address,
// which lives in Supabase auth.users rather than public.profiles - fetching
// it requires a service-role client (SUPABASE_SERVICE_ROLE_KEY), which is not
// currently configured in this project's environment. Once that key is added:
//   1. Create a service-role client in this file.
//   2. Look up the user's email via supabaseAdmin.auth.admin.getUserById(userId).
//   3. Send the email via the provider's SDK using `title` as subject and
//      `body` as the message.
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

  // Stub: log what would be emailed once a provider is connected.
  console.log(`[email stub] to user ${userId}: ${title} - ${body}`)
}
