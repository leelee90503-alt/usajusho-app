import { NextResponse, type NextRequest } from "next/server"
import type { EmailOtpType } from "@supabase/supabase-js"
import { createClient } from "@/lib/supabase/server"

// Handles Supabase auth email links (signup confirmation and password
// recovery today; also works for email-change / invite links if those
// templates are ever pointed here). The Supabase email templates link to
// this route with token_hash + type instead of relying on Supabase's own
// hosted /auth/v1/verify redirect, so we control the post-confirmation UX
// ourselves (a "confirmed" banner on the login page) rather than users
// landing on Supabase's generic error page - which is what happened while
// the project's Site URL / Redirect URL allowlist were still pointed at
// http://localhost:3000.
//
// This route lives under app/api/, so it is excluded from the next-intl
// locale middleware (see middleware.ts's matcher) and is reached at the
// same path regardless of the user's locale. The "next" query param (set
// in the email template) carries the locale-prefixed destination, e.g.
// /ja/login for a signup confirmation, /ja/reset-password for a password
// recovery link.
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const tokenHash = searchParams.get("token_hash")
  const type = searchParams.get("type") as EmailOtpType | null
  const isRecovery = type === "recovery"
  const next = searchParams.get("next") || (isRecovery ? "/ja/reset-password" : "/ja/login")

  const redirectTo = new URL(next, request.url)
  redirectTo.searchParams.delete("confirmed")
  redirectTo.searchParams.delete("confirm_error")
  redirectTo.searchParams.delete("reset_error")

  if (tokenHash && type) {
    const supabase = await createClient()
    const { error } = await supabase.auth.verifyOtp({
      type,
      token_hash: tokenHash,
    })

    if (!error) {
      if (isRecovery) {
        // Unlike signup confirmation, a password-recovery link needs to
        // leave the user signed in - the reset-password page uses this
        // session to call supabase.auth.updateUser({ password }). It signs
        // itself out afterwards.
        return NextResponse.redirect(redirectTo)
      }

      // verifyOtp establishes a live session, but the desired UX here is
      // "confirmed -> please log in" rather than silently landing on the
      // dashboard already authenticated, so drop the session immediately
      // and send them to the login page to sign in with their password.
      await supabase.auth.signOut()
      redirectTo.searchParams.set("confirmed", "1")
      return NextResponse.redirect(redirectTo)
    }
  }

  const errorRedirect = new URL(isRecovery ? "/ja/forgot-password" : "/ja/login", request.url)
  errorRedirect.searchParams.set(isRecovery ? "reset_error" : "confirm_error", "1")
  return NextResponse.redirect(errorRedirect)
}
