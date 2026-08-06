import { NextResponse } from "next/server"
import { WebhooksHelper } from "square"
import { createAdminClient } from "@/lib/supabase/admin"
import { getSquareWebhookSignatureKeys } from "@/lib/square"

// Square webhook endpoint for the purchase-agency payment flow.
//
// Both the Sandbox and Production webhook subscriptions in the Square
// Developer Dashboard point at this same URL
// (https://<your-domain>/api/webhooks/square), subscribed to at least:
// payment.updated, refund.updated. Each subscription has its own signature
// key - copy them into SQUARE_WEBHOOK_SIGNATURE_KEY_SANDBOX /
// SQUARE_WEBHOOK_SIGNATURE_KEY_PRODUCTION.
//
// Because the site can switch between Sandbox/Production at any time (see
// lib/square.ts), this route verifies the incoming signature against
// *both* keys rather than only whichever mode is currently active - a
// webhook already in flight when an admin flips the mode would otherwise
// be rejected.
//
// Note: this handler parses the raw webhook JSON itself (rather than via
// the Square SDK's response deserializers), so field names below are the
// wire format's snake_case (order_id, payment_id), not the SDK's camelCase.
export async function POST(request: Request) {
  const { sandbox: sandboxKey, production: productionKey } =
    getSquareWebhookSignatureKeys()

  if (!sandboxKey && !productionKey) {
    console.error(
      "Neither SQUARE_WEBHOOK_SIGNATURE_KEY_SANDBOX nor " +
        "SQUARE_WEBHOOK_SIGNATURE_KEY_PRODUCTION is set; rejecting webhook call.",
    )
    return NextResponse.json(
      { error: "Webhook not configured" },
      { status: 500 },
    )
  }

  const signature = request.headers.get("x-square-hmacsha256-signature")
  if (!signature) {
    return NextResponse.json({ error: "Missing signature" }, { status: 400 })
  }

  const payload = await request.text()

  const siteUrl =
    process.env.NEXT_PUBLIC_SITE_URL || "https://usajusho-app.vercel.app"
  const notificationUrl = `${siteUrl}/api/webhooks/square`

  async function matchesKey(signatureKey: string | undefined) {
    if (!signatureKey) return false
    try {
      return await WebhooksHelper.verifySignature({
        requestBody: payload,
        signatureHeader: signature!,
        signatureKey,
        notificationUrl,
      })
    } catch (err) {
      const message = err instanceof Error ? err.message : "unknown error"
      console.error("Square webhook signature verification error:", message)
      return false
    }
  }

  const isValid = (await matchesKey(sandboxKey)) || (await matchesKey(productionKey))

  if (!isValid) {
    console.error("Square webhook signature verification failed")
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 })
  }

  let event: { type?: string; data?: { object?: Record<string, unknown> } }
  try {
    event = JSON.parse(payload)
  } catch {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 })
  }

  const supabase = createAdminClient()

  switch (event.type) {
    case "payment.updated": {
      const payment = event.data?.object?.payment as
        | { id?: string; status?: string; order_id?: string }
        | undefined

      if (!payment?.order_id) {
        console.error("payment.updated missing payment.order_id")
        break
      }

      if (payment.status === "COMPLETED") {
        const { error } = await supabase
          .from("purchase_requests")
          .update({
            status: "paid",
            square_payment_id: payment.id,
            updated_at: new Date().toISOString(),
          })
          .eq("square_order_id", payment.order_id)

        if (error) {
          console.error("Failed to mark purchase request as paid:", error.message)
        }
      } else if (payment.status === "FAILED" || payment.status === "CANCELED") {
        console.error(
          `Payment ${payment.status.toLowerCase()} for order ${payment.order_id}`,
        )
      }
      break
    }

    case "refund.updated": {
      const refund = event.data?.object?.refund as
        | { payment_id?: string; status?: string }
        | undefined

      if (!refund?.payment_id || refund.status !== "COMPLETED") {
        break
      }

      const { error } = await supabase
        .from("purchase_requests")
        .update({ status: "refunded", updated_at: new Date().toISOString() })
        .eq("square_payment_id", refund.payment_id)

      if (error) {
        console.error("Failed to mark purchase request as refunded:", error.message)
      }
      break
    }

    default:
      break
  }

  return NextResponse.json({ received: true })
}
