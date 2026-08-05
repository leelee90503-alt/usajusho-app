import { createClient as createSupabaseClient } from "@supabase/supabase-js"

// Service-role Supabase client for trusted server-only contexts that have
// no authenticated user session to work from - currently only the Stripe
// webhook route (app/api/webhooks/stripe/route.ts), which needs to update
// a purchase_requests row on behalf of Stripe's server-to-server callback,
// bypassing RLS (there is no auth.uid() in that context).
//
// SUPABASE_SERVICE_ROLE_KEY does not exist in .env.local yet. Add it
// (found in Supabase project settings > API > service_role secret) once
// the webhook needs to run for real. Never expose this key to the client -
// it must only ever be read on the server (no NEXT_PUBLIC_ prefix).
export function createAdminClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error(
      "SUPABASE_SERVICE_ROLE_KEY (and NEXT_PUBLIC_SUPABASE_URL) must be " +
        "set to use the Supabase admin client.",
    )
  }

  return createSupabaseClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })
}
