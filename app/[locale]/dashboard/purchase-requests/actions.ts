"use server"

import { redirect } from "@/i18n/navigation"
import { getLocale } from "next-intl/server"
import { revalidatePath } from "next/cache"
import { createClient } from "@/lib/supabase/server"
import { getStripe } from "@/lib/stripe"
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
    const stripe = getStripe()
    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      customer_email: user.email ?? undefined,
      line_items: [
        {
          price_data: {
            currency: "usd",
            unit_amount: request.quote_total_cents,
            product_data: {
              name: "USAJUSHO 購入代行",
              description: request.product_description.slice(0, 500),
            },
          },
          quantity: 1,
        },
      ],
      success_url: `${siteUrl}/dashboard/purchase-requests/${request.id}?paid=1`,
      cancel_url: `${siteUrl}/dashboard/purchase-requests/${request.id}?cancelled=1`,
      metadata: {
        purchase_request_id: request.id,
      },
    })

    await supabase
      .from("purchase_requests")
      .update({
        status: "awaiting_payment",
        stripe_checkout_session_id: session.id,
        updated_at: new Date().toISOString(),
      })
      .eq("id", request.id)

    revalidatePath(`/dashboard/purchase-requests/${request.id}`)
    return { url: session.url }
  } catch (err) {
    const message = err instanceof Error ? err.message : "unknown error"
    return { error: `Stripe Checkoutセッションの作成に失敗しました: ${message}` }
  }
}
