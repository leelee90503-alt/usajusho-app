import { SquareClient, SquareEnvironment } from "square"
import { createAdminClient } from "@/lib/supabase/admin"

export type SquareMode = "sandbox" | "production"

// The site can run against either Square's Sandbox or Production
// environment. Which one is active is stored in
// public.purchase_agency_settings.square_mode (a single admin-editable
// row), not baked in at build/deploy time - this lets an admin flip the
// live site between test and real payments from /admin/purchase-requests
// without a redeploy.
//
// Each mode has its own credential set, read from env vars suffixed
// _SANDBOX / _PRODUCTION:
//   SQUARE_ACCESS_TOKEN_SANDBOX / SQUARE_ACCESS_TOKEN_PRODUCTION
//   SQUARE_LOCATION_ID_SANDBOX / SQUARE_LOCATION_ID_PRODUCTION
//   SQUARE_APPLICATION_ID_SANDBOX / SQUARE_APPLICATION_ID_PRODUCTION
//   SQUARE_WEBHOOK_SIGNATURE_KEY_SANDBOX / SQUARE_WEBHOOK_SIGNATURE_KEY_PRODUCTION
//
// SQUARE_APPLICATION_ID_* is the one value in this list that also needs to
// reach the browser (the Web Payments SDK's card form runs client-side and
// needs both applicationId and locationId to initialize). It is NOT a
// NEXT_PUBLIC_* var - it stays a plain server-only env var, read here, and
// handed to client components as a prop from a server component (see
// getSquareClientConfig() below), the same pattern already used for
// square_mode/SquareModeToggle's initialMode prop.

const clients: Partial<Record<SquareMode, SquareClient>> = {}

function envSuffix(mode: SquareMode): "SANDBOX" | "PRODUCTION" {
  return mode === "production" ? "PRODUCTION" : "SANDBOX"
}

function getAccessToken(mode: SquareMode): string | undefined {
  return process.env[`SQUARE_ACCESS_TOKEN_${envSuffix(mode)}`]
}

function getLocationId(mode: SquareMode): string | undefined {
  return process.env[`SQUARE_LOCATION_ID_${envSuffix(mode)}`]
}

function getApplicationId(mode: SquareMode): string | undefined {
  return process.env[`SQUARE_APPLICATION_ID_${envSuffix(mode)}`]
}

function getWebhookSignatureKey(mode: SquareMode): string | undefined {
  return process.env[`SQUARE_WEBHOOK_SIGNATURE_KEY_${envSuffix(mode)}`]
}

/**
 * Reads the currently-active Square environment from the database using
 * the service-role client, so it works regardless of who's calling it
 * (a logged-in customer creating a checkout link, an admin issuing a
 * refund, or an unauthenticated Square webhook request). Defaults to
 * "sandbox" - the safe choice - if the row is missing or the query fails.
 */
export async function getSquareMode(): Promise<SquareMode> {
  try {
    const supabase = createAdminClient()
    const { data } = await supabase
      .from("purchase_agency_settings")
      .select("square_mode")
      .eq("id", 1)
      .maybeSingle()

    return data?.square_mode === "production" ? "production" : "sandbox"
  } catch {
    return "sandbox"
  }
}

export async function getSquare(): Promise<SquareClient> {
  const mode = await getSquareMode()

  const cached = clients[mode]
  if (cached) {
    return cached
  }

  const accessToken = getAccessToken(mode)
  if (!accessToken) {
    throw new Error(
      `SQUARE_ACCESS_TOKEN_${envSuffix(mode)} is not set. Add it to ` +
        ".env.local (and to the Vercel project's environment variables) " +
        `for the currently-selected Square ${mode} environment.`,
    )
  }

  const client = new SquareClient({
    token: accessToken,
    environment:
      mode === "production" ? SquareEnvironment.Production : SquareEnvironment.Sandbox,
  })
  clients[mode] = client
  return client
}

export async function getSquareLocationId(): Promise<string> {
  const mode = await getSquareMode()
  const locationId = getLocationId(mode)
  if (!locationId) {
    throw new Error(
      `SQUARE_LOCATION_ID_${envSuffix(mode)} is not set. Add it to ` +
        ".env.local (and to the Vercel project's environment variables) " +
        `for the currently-selected Square ${mode} environment.`,
    )
  }
  return locationId
}

export async function getSquareApplicationId(): Promise<string> {
  const mode = await getSquareMode()
  const applicationId = getApplicationId(mode)
  if (!applicationId) {
    throw new Error(
      `SQUARE_APPLICATION_ID_${envSuffix(mode)} is not set. Add it to ` +
        ".env.local (and to the Vercel project's environment variables) " +
        `for the currently-selected Square ${mode} environment.`,
    )
  }
  return applicationId
}

/**
 * Convenience bundle for server components that need to hand the Web
 * Payments SDK its client-side config as props - mode/applicationId/
 * locationId are not secret (the SDK's own JS exposes them to the
 * browser), but there's no reason to add a NEXT_PUBLIC_* var when a
 * server component can just fetch this once and pass it down, the same
 * way SquareModeToggle already receives initialMode as a prop.
 */
export async function getSquareClientConfig(): Promise<{
  mode: SquareMode
  applicationId: string
  locationId: string
}> {
  const [mode, applicationId, locationId] = await Promise.all([
    getSquareMode(),
    getSquareApplicationId(),
    getSquareLocationId(),
  ])
  return { mode, applicationId, locationId }
}

/**
 * Both signature keys (Sandbox + Production), for the webhook route to
 * verify against. A webhook in flight may have been generated under the
 * environment that was active *before* an admin just switched modes, so
 * the route accepts a signature that matches either key rather than only
 * the currently-active one.
 */
export function getSquareWebhookSignatureKeys(): {
  sandbox?: string
  production?: string
} {
  return {
    sandbox: getWebhookSignatureKey("sandbox"),
    production: getWebhookSignatureKey("production"),
  }
}
