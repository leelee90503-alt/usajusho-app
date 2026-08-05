import Stripe from "stripe"

// Lazily-constructed singleton Stripe server SDK client.
//
// STRIPE_SECRET_KEY does not exist in this environment yet (the user will
// supply real Stripe API keys later). We intentionally do not read the env
// var at module load time so that importing this file never crashes local
// dev or the build - the key is only required once a caller actually needs
// to talk to Stripe (creating a Checkout Session, issuing a refund, etc.).
let stripeClient: Stripe | null = null

export function getStripe(): Stripe {
  if (stripeClient) {
    return stripeClient
  }

  const secretKey = process.env.STRIPE_SECRET_KEY
  if (!secretKey) {
    throw new Error(
      "STRIPE_SECRET_KEY is not set. Add it to .env.local (and to the " +
        "Vercel project's environment variables) once real Stripe API " +
        "keys are available.",
    )
  }

  stripeClient = new Stripe(secretKey, {
    apiVersion: "2026-07-29.dahlia",
  })
  return stripeClient
}
