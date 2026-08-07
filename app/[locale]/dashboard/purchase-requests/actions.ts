"use server"

import { randomUUID } from "crypto"
import { redirect } from "@/i18n/navigation"
import { getLocale } from "next-intl/server"
import { revalidatePath } from "next/cache"
import { createClient } from "@/lib/supabase/server"
import { getSquare, getSquareLocationId } from "@/lib/square"
import { notifyAdmins } from "@/lib/notifications"

export async function submitPurchaseRequest(formData: FormData) {
  const locale = await getLocale()
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect({ href: "/login", locale })
    return
  }

  const productUrl = String(formData.get("product_url") || "").trim()
  const productDescription = String(
    formData.get("product_description") || "",
  ).trim()
  const budgetCapRaw = formData.get("budget_cap")

  if (!productDescription) {
    return { error: "商品の説明は必須です。" }
  }

  const budgetCapDollars = budgetCapRaw ? Number(budgetCapRaw) : null
  const budgetCapCents =
    budgetCapDollars != null && !Number.isNaN(budgetCapDollars)
      ? Math.round(budgetCapDollars * 100)
      : null

  const { error } = await supabase.from("purchase_requests").insert({
    user_id: user.id,
    product_url: productUrl || null,
    product_description: productDescription,
    budget_cap_cents: budgetCapCents,
    status: "submitted",
  })

  if (error) {
    return { error: error.message }
  }

  await notifyAdmins({
    title: "新しい購入代行のご依頼が届きました",
    body: `${productDescription.slice(0, 50)} の購入代行リクエストが届きました。管理画面からご確認ください。`,
    titleEn: "New purchase-agency request received",
    bodyEn: `A purchase-agency request has been submitted for "${productDescription.slice(0, 50)}". Please check the admin dashboard.`,
  })

  revalidatePath("/dashboard/purchase-requests")
  return { success: true }
}

export async function cancelPurchaseRequest(requestId: string) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { error: "ログインしてください。" }
  }

  const { error } = await supabase
    .from("purchase_requests")
    .update({ status: "cancelled", updated_at: new Date().toISOString() })
    .eq("id", requestId)
    .eq("user_id", user.id)
    .in("status", ["submitted", "quote_sent", "awaiting_payment"])

  if (error) {
    return { error: error.message }
  }

  revalidatePath("/dashboard/purchase-requests")
  return { success: true }
}

export async function createCheckoutSession(requestId: string) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { error: "ログインしてください。" }
  }

  const { data: request, error: fetchError } = await supabase
    .from("purchase_requests")
    .select("id, user_id, status, quote_total_cents, product_description")
    .eq("id", requestId)
    .eq("user_id", user.id)
    .single()

  if (fetchError || !request) {
    return { error: "リクエストが見つかりません。" }
  }

  if (request.status !== "quote_sent" || !request.quote_total_cents) {
    return { error: "このリクエストには支払い可能な見積りがありません。" }
  }

  const siteUrl =
    process.env.NEXT_PUBLIC_SITE_URL || "https://usajusho-app.vercel.app"

  try {
    const square = await getSquare()
    const locationId = await getSquareLocationId()
    const { paymentLink } = await square.checkout.paymentLinks.create({
      idempotencyKey: randomUUID(),
      quickPay: {
        name: "USAJUSHO 購入代行",
        priceMoney: {
          amount: BigInt(request.quote_total_cents),
          currency: "USD",
        },
        locationId,
      },
      checkoutOptions: {
        redirectUrl: `${siteUrl}/dashboard/purchase-requests/${request.id}?paid=1`,
      },
      prePopulatedData: {
        buyerEmail: user.email ?? undefined,
      },
      paymentNote: request.product_description.slice(0, 500),
    })

    if (!paymentLink?.url || !paymentLink.orderId) {
      throw new Error("Square did not return a payment link URL")
    }

    await supabase
      .from("purchase_requests")
      .update({
        status: "awaiting_payment",
        square_order_id: paymentLink.orderId,
        updated_at: new Date().toISOString(),
      })
      .eq("id", request.id)

    revalidatePath(`/dashboard/purchase-requests/${request.id}`)
    return { url: paymentLink.url }
  } catch (err) {
    const message = err instanceof Error ? err.message : "unknown error"
    return { error: `Square Checkoutリンクの作成に失敗しました: ${message}` }
  }
}
