"use server"

import { redirect } from "@/i18n/navigation"
import { getLocale } from "next-intl/server"
import { revalidatePath } from "next/cache"
import { createClient } from "@/lib/supabase/server"
import { randomUUID } from "crypto"
import { notifyUser } from "@/lib/notifications"
import { getSquare, getSquareMode, type SquareMode } from "@/lib/square"

async function requireAdmin(): Promise<Awaited<ReturnType<typeof createClient>>> {
  const locale = await getLocale()
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect({ href: "/login", locale })
    return undefined as never
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("is_admin")
    .eq("id", user.id)
    .single()

  if (!profile?.is_admin) {
    redirect({ href: "/dashboard", locale })
    return undefined as never
  }

  return supabase
}

export async function sendQuote(
  requestId: string,
  itemPriceCents: number,
  feeCents: number,
  quoteNote: string,
  quoteExpiresAt: string | null,
) {
  const supabase = await requireAdmin()

  const totalCents = itemPriceCents + feeCents

  const { data: updated, error } = await supabase
    .from("purchase_requests")
    .update({
      quote_item_price_cents: itemPriceCents,
      quote_fee_cents: feeCents,
      quote_total_cents: totalCents,
      quote_note: quoteNote || null,
      quote_expires_at: quoteExpiresAt,
      status: "quote_sent",
      updated_at: new Date().toISOString(),
    })
    .eq("id", requestId)
    .select("user_id, product_description")
    .single()

  if (error) {
    return { error: error.message }
  }

  if (updated) {
    await notifyUser(supabase, {
      userId: updated.user_id,
      title: "購入代行の見積りが届きました",
      body: `${updated.product_description.slice(0, 50)} の見積り $${(
        totalCents / 100
      ).toLocaleString()} が届きました。ダッシュボードからお支払いください。`,
    })
  }

  revalidatePath("/admin/purchase-requests")
  revalidatePath(`/admin/purchase-requests/${requestId}`)
  return { success: true }
}

export async function markPurchasing(requestId: string) {
  const supabase = await requireAdmin()

  const { error } = await supabase
    .from("purchase_requests")
    .update({ status: "purchasing", updated_at: new Date().toISOString() })
    .eq("id", requestId)
    .eq("status", "paid")

  if (error) {
    return { error: error.message }
  }

  revalidatePath("/admin/purchase-requests")
  revalidatePath(`/admin/purchase-requests/${requestId}`)
  return { success: true }
}

export async function markPurchasedAndLinkPackage(
  requestId: string,
  itemName: string,
) {
  const supabase = await requireAdmin()

  const { data: request, error: fetchError } = await supabase
    .from("purchase_requests")
    .select("id, user_id, status")
    .eq("id", requestId)
    .single()

  if (fetchError || !request) {
    return { error: "リクエストが見つかりません。" }
  }

  if (request.status !== "purchasing") {
    return { error: "このリクエストは購入中の状態ではありません。" }
  }

  // Created with status "missing" even though the customer is already known:
  // the item hasn't physically arrived at the warehouse yet, so it still
  // needs an admin to weigh/measure it and send a quote via the Missing
  // Packages flow on /admin/packages before it can move to "quoted".
  const { data: pkg, error: pkgError } = await supabase
    .from("packages")
    .insert({
      user_id: request.user_id,
      item_name: itemName,
      status: "missing",
      admin_note: `購入代行リクエスト ${request.id} 経由で作成`,
    })
    .select("id")
    .single()

  if (pkgError || !pkg) {
    return { error: pkgError?.message ?? "パッケージの作成に失敗しました。" }
  }

  const { error: updateError } = await supabase
    .from("purchase_requests")
    .update({
      status: "purchased",
      linked_package_id: pkg.id,
      updated_at: new Date().toISOString(),
    })
    .eq("id", requestId)

  if (updateError) {
    return { error: updateError.message }
  }

  await notifyUser(supabase, {
    userId: request.user_id,
    packageId: pkg.id,
    title: "商品の購入が完了しました",
    body: "ご依頼の商品を購入しました。倉庫への到着後、通常の配送フローでお届けします。",
  })

  revalidatePath("/admin/purchase-requests")
  revalidatePath(`/admin/purchase-requests/${requestId}`)
  revalidatePath("/admin/packages")
  return { success: true, packageId: pkg.id }
}

export async function refundPurchaseRequest(requestId: string) {
  const supabase = await requireAdmin()

  const { data: request, error: fetchError } = await supabase
    .from("purchase_requests")
    .select("id, user_id, status, square_payment_id, quote_total_cents, product_description")
    .eq("id", requestId)
    .single()

  if (fetchError || !request) {
    return { error: "リクエストが見つかりません。" }
  }

  if (!request.square_payment_id || !request.quote_total_cents) {
    return { error: "このリクエストにはSquareの支払い情報がありません。" }
  }

  try {
    const square = await getSquare()
    await square.refunds.refundPayment({
      idempotencyKey: randomUUID(),
      paymentId: request.square_payment_id,
      amountMoney: {
        amount: BigInt(request.quote_total_cents),
        currency: "USD",
      },
      reason: "USAJUSHO admin refund",
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : "unknown error"
    return { error: `Squareの返金処理に失敗しました: ${message}` }
  }

  const { error: updateError } = await supabase
    .from("purchase_requests")
    .update({ status: "refunded", updated_at: new Date().toISOString() })
    .eq("id", requestId)

  if (updateError) {
    return { error: updateError.message }
  }

  await notifyUser(supabase, {
    userId: request.user_id,
    title: "返金処理が完了しました",
    body: `${request.product_description.slice(0, 50)} のご依頼について返金処理を行いました。`,
  })

  revalidatePath("/admin/purchase-requests")
  revalidatePath(`/admin/purchase-requests/${requestId}`)
  return { success: true }
}

export async function cancelRequestAsAdmin(requestId: string) {
  const supabase = await requireAdmin()

  const { data: request, error: fetchError } = await supabase
    .from("purchase_requests")
    .select("id, user_id, product_description")
    .eq("id", requestId)
    .single()

  if (fetchError || !request) {
    return { error: "リクエストが見つかりません。" }
  }

  const { error } = await supabase
    .from("purchase_requests")
    .update({ status: "cancelled", updated_at: new Date().toISOString() })
    .eq("id", requestId)

  if (error) {
    return { error: error.message }
  }

  await notifyUser(supabase, {
    userId: request.user_id,
    title: "購入代行のご依頼がキャンセルされました",
    body: `${request.product_description.slice(0, 50)} のご依頼はキャンセルされました。ご不明な点がございましたらサポートまでお問い合わせください。`,
  })

  revalidatePath("/admin/purchase-requests")
  revalidatePath(`/admin/purchase-requests/${requestId}`)
  return { success: true }
}

export async function saveFeeSettings(formData: FormData) {
  const supabase = await requireAdmin()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  const flatFeeDollars = Number(formData.get("flat_fee_dollars"))
  const feePercent = Number(formData.get("fee_percent"))

  if (Number.isNaN(flatFeeDollars) || flatFeeDollars < 0) {
    return { error: "正しい定額手数料を入力してください。" }
  }
  if (Number.isNaN(feePercent) || feePercent < 0) {
    return { error: "正しい手数料率を入力してください。" }
  }

  const flatFeeCents = Math.round(flatFeeDollars * 100)

  const { error } = await supabase
    .from("purchase_agency_settings")
    .update({
      flat_fee_cents: flatFeeCents,
      fee_percent: feePercent,
      updated_at: new Date().toISOString(),
      updated_by: user?.id ?? null,
    })
    .eq("id", 1)

  if (error) {
    return { error: error.message }
  }

  revalidatePath("/admin/purchase-requests")
  return { success: true }
}

// Real, functional Sandbox <-> Production switch for Square payments. This
// flips public.purchase_agency_settings.square_mode, which lib/square.ts
// reads (via the service-role client) on every checkout-link creation,
// refund, and webhook verification - so the change takes effect
// immediately for the whole live site, no redeploy needed.
export async function getCurrentSquareMode(): Promise<SquareMode> {
  return getSquareMode()
}

export async function setSquareMode(mode: SquareMode) {
  const supabase = await requireAdmin()

  if (mode !== "sandbox" && mode !== "production") {
    return { error: "Invalid mode" }
  }

  const {
    data: { user },
  } = await supabase.auth.getUser()

  const { error } = await supabase
    .from("purchase_agency_settings")
    .update({
      square_mode: mode,
      updated_at: new Date().toISOString(),
      updated_by: user?.id ?? null,
    })
    .eq("id", 1)

  if (error) {
    return { error: error.message }
  }

  revalidatePath("/admin/purchase-requests")
  return { success: true, mode }
}

// Normalizes a raw domain/URL typed by an admin into a bare lowercase
// hostname (no protocol, no "www.", no path/query), e.g. turns
// "https://www.Amazon.com/some/path?x=1" into "amazon.com". Duplicated
// (rather than shared) with the client-side normalization in
// ./whitelist-form.tsx as defense in depth against a bypassed client.
function normalizeDomain(input: string): string {
  return input
    .trim()
    .toLowerCase()
    .replace(/^https?:\/\//, "")
    .replace(/^www\./, "")
    .split("/")[0]
    .split("?")[0]
}

export async function addWhitelistDomain(formData: FormData) {
  const supabase = await requireAdmin()

  const label = String(formData.get("label") || "").trim()
  const domain = normalizeDomain(String(formData.get("domain") || ""))

  if (!label) {
    return { error: "表示名を入力してください。" }
  }
  if (!domain) {
    return { error: "正しいドメインを入力してください。" }
  }

  const {
    data: { user },
  } = await supabase.auth.getUser()

  const { data, error } = await supabase
    .from("purchase_agency_whitelist_domains")
    .insert({ domain, label, created_by: user?.id ?? null })
    .select("id, domain, label, enabled")
    .single()

  if (error) {
    return { error: error.message }
  }

  revalidatePath("/admin/purchase-requests")
  return { success: true, domain: data }
}

export async function toggleWhitelistDomain(id: string, enabled: boolean) {
  const supabase = await requireAdmin()

  const { error } = await supabase
    .from("purchase_agency_whitelist_domains")
    .update({ enabled })
    .eq("id", id)

  if (error) {
    return { error: error.message }
  }

  revalidatePath("/admin/purchase-requests")
  return { success: true }
}

export async function deleteWhitelistDomain(id: string) {
  const supabase = await requireAdmin()

  const { error } = await supabase
    .from("purchase_agency_whitelist_domains")
    .delete()
    .eq("id", id)

  if (error) {
    return { error: error.message }
  }

  revalidatePath("/admin/purchase-requests")
  return { success: true }
}
