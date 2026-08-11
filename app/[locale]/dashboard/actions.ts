"use server"

import { revalidatePath } from "next/cache"
import { randomUUID } from "crypto"
import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { notifyAdmins } from "@/lib/notifications"
import { getSquare, getSquareLocationId } from "@/lib/square"

// Charges the shipping quote directly via square.payments.create(), using
// the card token (sourceId) the browser's Square Web Payments SDK produced.
// This used to be a stub that marked the package "paid" with no real
// charge at all - it now performs a real Square payment, the same way
// payPurchaseRequestWithCard() and payAdditionalChargeWithCard() do.
// packages.quote_amount is stored in whole dollars (not cents), unlike
// purchase_requests/additional_charges.
//
// The final status write uses the admin/service-role client (matching the
// other two payment actions and the webhook) rather than the user's own
// client, so the "paid" write only ever happens right after this action
// itself independently confirms Square reports the payment COMPLETED.
export async function payShipmentWithCard(packageId: string, sourceId: string) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { error: "ログインしてください。" }
  }

  const { data: pkg, error: fetchError } = await supabase
    .from("packages")
    .select("id, user_id, status, quote_amount, item_name")
    .eq("id", packageId)
    .eq("user_id", user.id)
    .single()

  if (fetchError || !pkg) {
    return { error: "パッケージが見つかりません。" }
  }

  if (pkg.status !== "quoted" || !pkg.quote_amount) {
    return { error: "このパッケージには支払い可能な見積りがありません。" }
  }

  try {
    const square = await getSquare()
    const locationId = await getSquareLocationId()
    const { payment } = await square.payments.create({
      sourceId,
      idempotencyKey: randomUUID(),
      amountMoney: {
        amount: BigInt(Math.round(Number(pkg.quote_amount) * 100)),
        currency: "USD",
      },
      locationId,
      note: `Shipping: ${pkg.item_name}`.slice(0, 500),
    })

    if (payment?.status !== "COMPLETED" || !payment.id) {
      return {
        error: "お支払いを完了できませんでした。カード情報をご確認のうえ、再度お試しください。",
      }
    }

    const { error } = await createAdminClient()
      .from("packages")
      .update({
        status: "paid",
        square_payment_id: payment.id,
        updated_at: new Date().toISOString(),
      })
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
  } catch (err) {
    const message = err instanceof Error ? err.message : "unknown error"
    return { error: `お支払い処理に失敗しました: ${message}` }
  }
}

// Charges an admin-issued additional charge directly via
// square.payments.create() - mirrors payPurchaseRequestWithCard() in
// app/[locale]/dashboard/purchase-requests/actions.ts (see
// createAdditionalCharge() in app/[locale]/admin/packages/actions.ts for
// how a charge gets created in the first place).
export async function payAdditionalChargeWithCard(chargeId: string, sourceId: string) {
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
    const { payment } = await square.payments.create({
      sourceId,
      idempotencyKey: randomUUID(),
      amountMoney: {
        amount: BigInt(charge.amount_cents),
        currency: "USD",
      },
      locationId,
      note: charge.reason.slice(0, 500),
    })

    if (payment?.status !== "COMPLETED" || !payment.id) {
      return {
        error: "お支払い完了できませんでした。カード情報をご確認のうえ、再度お試しください。",
      }
    }

    await createAdminClient()
      .from("additional_charges")
      .update({
        status: "paid",
        square_payment_id: payment.id,
        updated_at: new Date().toISOString(),
      })
      .eq("id", charge.id)

    revalidatePath("/dashboard")
    return { success: true }
  } catch (err) {
    const message = err instanceof Error ? err.message : "unknown error"
    return { error: `お支払い処理に失敗しました: ${message}` }
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
