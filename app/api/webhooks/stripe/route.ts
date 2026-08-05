import { NextResponse } from "next/server"
import type Stripe from "stripe"
import { getStripe } from "@/lib/stripe"
import { createAdminClient } from "@/lib/supabase/admin"

// Stripe webhook endpoint for the purchase-agency payment flow.
//
// Configure this URL (https://<your-domain>/api/webhooks/stripe) in the
// Stripe Dashboard under Developers > Webhooks once real API keys exist,
// subscribed to at least: checkout.session.completed, charge.refunded,
// payment_intent.payment_failed. Copy the signing secret it gives you into
// STRIPE_WEBHOOK_SECRET.
export async function POST(request: Request) {
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET
  if (!webhookSecret) {
    console.error("STRIPE_WEBHOOK_SECRET is not set; rejecting webhook call.")
    return NextResponse.json(
      { error: "Webhook not configured" },
      { status: 500 },
    )
  }

  const signature = request.headers.get("stripe-signature")
  if (!signature) {
    return NextResponse.json({ error: "Missing signature" }, { status: 400 })
  }

  const payload = await request.text()

  let event: Stripe.Event
  try {
    const stripe = getStripe()
    event = stripe.webhooks.constructEvent(payload, signature, webhookSecret)
  } catch (err) {
    const message = err instanceof Error ? err.message : "unknown error"
    console.error("Stripe webhook signature verification failed:", message)
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 })
  }

  const supabase = createAdminClient()

  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object as Stripe.Checkout.Session
      const requestId = session.metadata?.purchase_request_id
      if (!requestId) {
        console.error("checkout.session.completed missing purchase_request_id metadata")
        break
      }

      const paymentIntentId =
        typeof session.payment_intent === "string"
          ? session.payment_intent
          : session.payment_intent?.id ?? null

      const { error } = await supabase
        .from("purchase_requests")
        .update({
          status: "paid",
          stripe_payment_intent_id: paymentIntentId,
          updated_at: new Date().toISOString(),
        })
        .eq("id", requestId)
        .eq("stripe_checkout_session_id", session.id)

      if (error) {
        console.error("Failed to mark purchase request as paid:", error.message)
      }
      break
    }

    case "charge.refunded": {
      const charge = event.data.object as Stripe.Charge
      const paymentIntentId =
        typeof charge.payment_intent === "string"
          ? charge.payment_intent
          : charge.payment_intent?.id ?? null

      if (!paymentIntentId) {
        break
      }

      const { error } = await supabase
        .from("purchase_requests")
        .update({ status: "refunded", updated_at: new Date().toISOString() })
        .eq("stripe_payment_intent_id", paymentIntentId)

      if (error) {
        console.error("Failed to mark purchase request as refunded:", error.message)
      }
      break
    }

    case "payment_intent.payment_failed": {
      const paymentIntent = event.data.object as Stripe.PaymentIntent
      console.error(
        `Payment failed for payment_intent ${paymentIntent.id}: ${paymentIntent.last_payment_error?.message ?? "unknown reason"}`,
      )
      break
    }

    default:
      break
  }

  return NextResponse.json({ received: true })
}
