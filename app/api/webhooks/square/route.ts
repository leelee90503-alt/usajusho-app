import { NextResponse } from "next/server"
import { WebhooksHelper } from "square"
import { createAdminClient } from "@/lib/supabase/admin"

// Square webhook endpoint for the purchase-agency payment flow.
//
// Configure this URL (https://<your-domain>/api/webhooks/square) as a
// webhook subscription in the Square Developer Dashboard once real API
// credentials exist, subscribed to at least: payment.updated,
// refund.updated. Copy the subscription's signature key into
// SQUARE_WEBHOOK_SIGNATURE_KEY.
//
// Note: this handler parses the raw webhook JSON itself (rather than via
// the Square SDK's response deserializers), so field names below are the
// wire format's snake_case (order_id, payment_id), not the SDK's camelCase.
export async function POST(request: Request) {
  const signatureKey = process.env.SQUARE_WEBHOOK_SIGNATURE_KEY
  if (!signatureKey) {
    console.error("SQUARE_WEBHOOK_SIGNATURE_KEY is not set; rejecting webhook call.")
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

  let isValid = false
  try {
    isValid = await WebhooksHelper.verifySignature({
      requestBody: payload,
      signatureHeader: signature,
      signatureKey,
      notificationUrl: `${siteUrl}/api/webhooks/square`,
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : "unknown error"
    console.error("Square webhook signature verification error:", message)
  }

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
