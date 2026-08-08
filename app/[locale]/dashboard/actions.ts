"use server"

import { revalidatePath } from "next/cache"
import { randomUUID } from "crypto"
import { createClient } from "@/lib/supabase/server"
import { notifyAdmins } from "@/lib/notifications"
import { getSquare, getSquareLocationId } from "@/lib/square"

export async function payForShipment(packageId: string) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { error: "ログインしてください。" }
  }

  // NOTE: Square is not yet connected. This marks the package as paid directly
  // as a stand-in for a real checkout flow. Swap this for a Square Payment
  // Link + webhook once payment credentials are available.
  const { error } = await supabase
    .from("packages")
    .update({ status: "paid", updated_at: new Date().toISOString() })
    .eq("id", packageId)
    .eq("user_id", user.id)
    .eq("status", "quoted")

  if (error) {
    return { error: error.message }
  }

  await notifyAdmins({
    packageId,
    title: "配送料のお支払いが完了しました",
    body: "配送料のお支払いが完了しました。管理画面からご確認ください。",
    titleEn: "Shipping payment completed",
    bodyEn: "The customer has completed payment for shipping. Please check the admin dashboard.",
  })

  revalidatePath("/dashboard")
  revalidatePath("/admin/packages")

  return { success: true }
}

// Mirrors createCheckoutSession() in
// app/[locale]/dashboard/purchase-requests/actions.ts -- a Square
// "quickPay" payment link for a single additional charge issued by an
// admin (see createAdditionalCharge() in app/[locale]/admin/packages/actions.ts).
// The charge is marked "paid" by the Square webhook, not here.
export async function createAdditionalChargeCheckoutSession(chargeId: string) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { error: "ログインしてください。" }
  }

  const { data: charge, error: fetchError } = await supabase
    .from("additional_charges")
    .select("id, user_id, status, amount_cents, reason")
    .eq("id", chargeId)
    .eq("user_id", user.id)
    .single()

  if (fetchError || !charge) {
    return { error: "追加料金が見つかりません。" }
  }

  if (charge.status !== "pending") {
    return { error: "この追加料金はすでに処理されています。" }
  }

  try {
    const square = await getSquare()
    const locationId = await getSquareLocationId()
    const siteUrl =
      process.env.NEXT_PUBLIC_SITE_URL || "https://usajusho-app.vercel.app"

    const { paymentLink } = await square.checkout.paymentLinks.create({
      idempotencyKey: randomUUID(),
      quickPay: {
        name: "USAJUSHO 追加料金",
        priceMoney: {
          amount: BigInt(charge.amount_cents),
          currency: "USD",
        },
        locationId,
      },
      checkoutOptions: {
        redirectUrl: `${siteUrl}/dashboard?paid=1`,
      },
      prePopulatedData: {
        buyerEmail: user.email ?? undefined,
      },
      paymentNote: charge.reason.slice(0, 500),
    })

    if (!paymentLink?.url || !paymentLink.orderId) {
      throw new Error("Square did not return a payment link URL")
    }

    await supabase
      .from("additional_charges")
      .update({
        status: "awaiting_payment",
        square_order_id: paymentLink.orderId,
        updated_at: new Date().toISOString(),
      })
      .eq("id", charge.id)

    revalidatePath("/dashboard")
    return { url: paymentLink.url }
  } catch (err) {
    const message = err instanceof Error ? err.message : "unknown error"
    return { error: `Square Checkoutリンクの作成に失敗しました: ${message}` }
  }
}

export async function markNotificationRead(notificationId: string) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { error: "ログインしてください。" }
  }

  const { error } = await supabase
    .from("notifications")
    .update({ is_read: true })
    .eq("id", notificationId)
    .eq("user_id", user.id)

  if (error) {
    return { error: error.message }
  }

  revalidatePath("/dashboard")
  return { success: true }
}

export async function updateContactInfo(fields: {
  phone_number: string
  japan_postal_code: string
  japan_prefecture: string
  japan_city: string
  japan_address_line1: string
  japan_address_line2: string
}) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { error: "ログインしてください。" }
  }

  const { error } = await supabase
    .from("profiles")
    .update({
      phone_number: fields.phone_number.trim() || null,
      japan_postal_code: fields.japan_postal_code.trim() || null,
      japan_prefecture: fields.japan_prefecture.trim() || null,
      japan_city: fields.japan_city.trim() || null,
      japan_address_line1: fields.japan_address_line1.trim() || null,
      japan_address_line2: fields.japan_address_line2.trim() || null,
    })
    .eq("id", user.id)

  if (error) {
    return { error: error.message }
  }

  revalidatePath("/dashboard")
  revalidatePath("/dashboard/profile")

  return { success: true }
}

export async function markAllNotificationsRead() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { error: "ログインしてください。" }
  }

  const { error } = await supabase
    .from("notifications")
    .update({ is_read: true })
    .eq("user_id", user.id)
    .eq("is_read", false)

  if (error) {
    return { error: error.message }
  }

  revalidatePath("/dashboard")
  return { success: true }
}
