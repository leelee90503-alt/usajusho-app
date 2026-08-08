"use server"

import { redirect } from '@/i18n/navigation'
import { getLocale } from 'next-intl/server'
import { revalidatePath } from "next/cache"
import { createClient } from "@/lib/supabase/server"
import { notifyUser } from "@/lib/notifications"
import { calculateChargeableWeight } from "@/lib/pricing"
import { formatUSD } from "@/lib/format"

export async function requireAdmin(): Promise<Awaited<ReturnType<typeof createClient>>> {
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

// Registers a physical package that arrived without a matching pre-declaration
// (the admin searched the pending declarations list and could not find the
// order it belongs to). The package has no known owner yet, so it is created
// with user_id left blank and status "missing" -- it will not appear on any
// customer's dashboard until an admin later links it to a suite number via
// resolveMissingPackage() below, which also sends the shipping quote in the
// same step.
export async function registerMissingPackage(formData: FormData) {
  const supabase = await requireAdmin()

  const itemName = String(formData.get("item_name") || "").trim()
  const trackingNumber = String(formData.get("tracking_number") || "").trim()
  const weightKgRaw = formData.get("weight_kg")
  const lengthCmRaw = formData.get("length_cm")
  const widthCmRaw = formData.get("width_cm")
  const heightCmRaw = formData.get("height_cm")
  const adminNote = String(formData.get("admin_note") || "").trim()

  if (!itemName) {
    return { error: "品名は必須です。" }
  }

  const weightKg = weightKgRaw ? Number(weightKgRaw) : null
  const lengthCm = lengthCmRaw ? Number(lengthCmRaw) : null
  const widthCm = widthCmRaw ? Number(widthCmRaw) : null
  const heightCm = heightCmRaw ? Number(heightCmRaw) : null

  const { volumetricWeightKg, chargeableWeightKg } = calculateChargeableWeight({
    weightKg,
    lengthCm,
    widthCm,
    heightCm,
  })

  const { error: insertError } = await supabase.from("packages").insert({
    user_id: null,
    item_name: itemName,
    tracking_number: trackingNumber || null,
    weight_kg: weightKg,
    length_cm: lengthCm,
    width_cm: widthCm,
    height_cm: heightCm,
    volumetric_weight_kg: volumetricWeightKg || null,
    chargeable_weight_kg: chargeableWeightKg || null,
    admin_note: adminNote || null,
    status: "missing",
  })

  if (insertError) {
    return { error: insertError.message }
  }

  revalidatePath("/admin/packages")
  return { success: true }
}

// Resolves a "missing" package (no owner yet, or -- for packages created via
// the purchase-agency flow -- an owner but no weight/quote yet) by assigning
// it to a customer and sending the shipping quote in the same step. If the
// package already has an owner, suiteNumber is ignored. If a matching
// customer has exactly one pending pre-declaration on file, it is
// auto-linked to this package too, so it drops off the pending list.
const MIN_PACKAGE_PHOTOS = 3
const MAX_PACKAGE_PHOTOS = 5

export async function resolveMissingPackage(
  packageId: string,
  params: {
    suiteNumber?: string
    weightKg: number | null
    lengthCm: number | null
    widthCm: number | null
    heightCm: number | null
    trackingNumber: string
    memo: string
    quoteAmount: number | null
    photos: File[]
  }
) {
  const supabase = await requireAdmin()

  const { data: pkg, error: pkgError } = await supabase
    .from("packages")
    .select("id, user_id, item_name, status, shipping_prepaid, quote_amount")
    .eq("id", packageId)
    .single()

  if (pkgError || !pkg) {
    return { error: "荷物が見つかりません。" }
  }

  if (pkg.status !== "missing") {
    return { error: "この荷物はすでに処理済みです。" }
  }

  // Photos taken during inspection are required every time a quote is
  // issued (or a prepaid package's arrival is confirmed) so the customer
  // can see the actual condition of what arrived -- see
  // package-photos-migration.sql for the storage bucket + table this
  // writes to.
  const photos = (params.photos || []).filter((f) => f && f.size > 0)
  if (photos.length < MIN_PACKAGE_PHOTOS || photos.length > MAX_PACKAGE_PHOTOS) {
    return { error: `荷物の写真を${MIN_PACKAGE_PHOTOS}〜${MAX_PACKAGE_PHOTOS}枚添付してください。` }
  }

  // Packages linked from a purchase-agency request already had their
  // shipping cost collected as part of that quote (see
  // markPurchasedAndLinkPackage() in
  // app/[locale]/admin/purchase-requests/actions.ts), so they skip the
  // normal "must enter a positive quote amount" requirement below and go
  // straight to "paid" instead of "quoted" -- no second payment needed.
  const isPrepaid = pkg.shipping_prepaid === true

  if (!isPrepaid && (!params.quoteAmount || params.quoteAmount <= 0)) {
    return { error: "正しい見積金額を入力してください。" }
  }

  let targetUserId = pkg.user_id

  if (!targetUserId) {
    const suiteNumber = (params.suiteNumber || "").trim()
    if (!suiteNumber) {
      return { error: "スイート番号を入力してください。" }
    }

    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("id")
      .eq("suite_number", suiteNumber)
      .single()

    if (profileError || !profile) {
      return { error: `スイート番号 ${suiteNumber} のユーザーが見つかりません。` }
    }

    targetUserId = profile.id
  }

  const { volumetricWeightKg, chargeableWeightKg } = calculateChargeableWeight({
    weightKg: params.weightKg,
    lengthCm: params.lengthCm,
    widthCm: params.widthCm,
    heightCm: params.heightCm,
  })

  const memo = params.memo.trim() || null

  // Prepaid packages keep the quote_amount already set at link time (the
  // shipping cost collected via the purchase-agency quote) rather than
  // being overwritten by this form's (typically empty) quote amount field.
  const quoteAmount = isPrepaid ? pkg.quote_amount : params.quoteAmount

  const { error: updateError } = await supabase
    .from("packages")
    .update({
      user_id: targetUserId,
      weight_kg: params.weightKg,
      length_cm: params.lengthCm,
      width_cm: params.widthCm,
      height_cm: params.heightCm,
      volumetric_weight_kg: volumetricWeightKg || null,
      chargeable_weight_kg: chargeableWeightKg || null,
      tracking_number: params.trackingNumber.trim() || null,
      admin_note: memo,
      quote_amount: quoteAmount,
      quote_note: memo,
      status: isPrepaid ? "paid" : "quoted",
      updated_at: new Date().toISOString(),
    })
    .eq("id", packageId)

  if (updateError) {
    return { error: updateError.message }
  }

  // Upload the inspection photos and record them against this package.
  // Uploaded to "{packageId}/{uuid}.{ext}" so storage RLS can grant the
  // owning customer read access by package_id (see
  // package-photos-migration.sql) without needing the admin's own uid in
  // the path.
  for (const photo of photos) {
    const ext = photo.name.includes(".") ? photo.name.split(".").pop() : "jpg"
    const path = `${packageId}/${crypto.randomUUID()}.${ext}`
    const { error: uploadError } = await supabase.storage
      .from("package-photos")
      .upload(path, photo, { contentType: photo.type || undefined })

    if (uploadError) {
      return { error: uploadError.message }
    }

    const { error: photoInsertError } = await supabase
      .from("package_photos")
      .insert({ package_id: packageId, storage_path: path })

    if (photoInsertError) {
      return { error: photoInsertError.message }
    }
  }

  // Best-effort: if this customer has exactly one pending pre-declaration,
  // it almost certainly refers to this same package, so link it too. If
  // there's more than one, it's ambiguous -- leave them all pending so an
  // admin can match the right one by hand.
  const { data: pendingDeclarations } = await supabase
    .from("package_declarations")
    .select("id")
    .eq("user_id", targetUserId)
    .eq("status", "pending")

  if (pendingDeclarations && pendingDeclarations.length === 1) {
    await supabase
      .from("package_declarations")
      .update({
        status: "matched",
        matched_package_id: packageId,
        updated_at: new Date().toISOString(),
      })
      .eq("id", pendingDeclarations[0].id)
  }

  if (isPrepaid) {
    await notifyUser(supabase, {
      userId: targetUserId,
      packageId,
      title: "お荷物の到着が確認できました",
      body: `${pkg.item_name} の到着と重量を確認しました。送料は購入代行のお見積りでお支払い済みのため、追加のお支払いは不要です。まもなく発送いたします。${
        memo ? `メモ: ${memo}` : ""
      }`,
      titleEn: "Your package has arrived",
      bodyEn: `We've confirmed the arrival and weight of "${pkg.item_name}". Shipping was already paid as part of your purchase-agency quote, so no further payment is needed. It will ship soon.${
        memo ? ` Note: ${memo}.` : ""
      }`,
    })
  } else {
    const amount = formatUSD(quoteAmount ?? 0)
    await notifyUser(supabase, {
      userId: targetUserId,
      packageId,
      title: "送料の見積りが届きました",
      body: `${pkg.item_name} の送料見積り $${amount} が届きました。${
        memo ? `メモ: ${memo} ` : ""
      }ダッシュボードからお支払いください。`,
      titleEn: "Your shipping quote is ready",
      bodyEn: `Your shipping quote of $${amount} for "${pkg.item_name}" is ready.${
        memo ? ` Note: ${memo}.` : ""
      } Please pay from your dashboard.`,
    })
  }

  revalidatePath("/admin/packages")
  revalidatePath("/dashboard")
  return { success: true }
}

export async function updatePackageStatus(packageId: string, status: string) {
  const supabase = await requireAdmin()

  // Shipping a package without ever recording an outbound tracking number
  // left customers with no way to track their delivery. Block the raw
  // status dropdown from jumping straight to "shipped" unless a tracking
  // number is already on file -- the normal path is the "preparing
  // shipment" panel's markShipped() below, which collects the tracking
  // number and sets this status together.
  if (status === "shipped") {
    const { data: current, error: fetchError } = await supabase
      .from("packages")
      .select("tracking_number")
      .eq("id", packageId)
      .single()

    if (fetchError) {
      return { error: fetchError.message }
    }

    if (!current?.tracking_number?.trim()) {
      return { error: "発送完了にする前に、配送追跡番号を入力してください。" }
    }
  }

  // A "missing" package has no confirmed owner (user_id may be null) until
  // it's resolved via resolveMissingPackage(), which assigns the customer
  // and sends the quote together. Block the raw status dropdown from moving
  // a missing package to any other status directly -- doing so would strand
  // a package with no owner in a status customers are expected to see.
  if (status !== "missing") {
    const { data: current, error: fetchError } = await supabase
      .from("packages")
      .select("status, user_id")
      .eq("id", packageId)
      .single()

    if (fetchError) {
      return { error: fetchError.message }
    }

    if (current?.status === "missing" && !current.user_id) {
      return { error: "先にお客様のスイート番号を入力して紐づけてください。" }
    }
  }

  const { data: updated, error } = await supabase
    .from("packages")
    .update({ status, updated_at: new Date().toISOString() })
    .eq("id", packageId)
    .select("user_id, item_name, tracking_number")
    .single()

  if (error) {
    return { error: error.message }
  }

  if (status === "shipped" && updated) {
    await notifyUser(supabase, {
      userId: updated.user_id,
      packageId,
      title: "発送が完了しました",
      body: `${updated.item_name} の発送が完了しました。追跡番号: ${updated.tracking_number}`,
      titleEn: "Your package has shipped",
      bodyEn: `"${updated.item_name}" has shipped. Tracking number: ${updated.tracking_number}`,
    })
  }

  revalidatePath("/admin/packages")
  revalidatePath("/dashboard")
  return { success: true }
}

// Primary path for completing a shipment: collects the outbound tracking
// number (US warehouse -> customer's Japan address) and moves the package
// to "shipped" in one step, so a shipment is never marked complete without
// a tracking number attached.
export async function markShipped(packageId: string, trackingNumber: string) {
  const supabase = await requireAdmin()

  const trimmed = trackingNumber.trim()
  if (!trimmed) {
    return { error: "配送追跡番号を入力してください。" }
  }

  const { data: updated, error } = await supabase
    .from("packages")
    .update({
      tracking_number: trimmed,
      status: "shipped",
      updated_at: new Date().toISOString(),
    })
    .eq("id", packageId)
    .select("user_id, item_name")
    .single()

  if (error) {
    return { error: error.message }
  }

  if (updated) {
    await notifyUser(supabase, {
      userId: updated.user_id,
      packageId,
      title: "発送が完了しました",
      body: `${updated.item_name} の発送が完了しました。追跡番号: ${trimmed}`,
      titleEn: "Your package has shipped",
      bodyEn: `"${updated.item_name}" has shipped. Tracking number: ${trimmed}`,
    })
  }

  revalidatePath("/admin/packages")
  revalidatePath("/dashboard")
  return { success: true }
}

// Bills a customer an extra amount against an already-existing package --
// e.g. the item weighed more than the original estimate. Modeled on the
// purchase_requests Square payment-link flow (createCheckoutSession() in
// app/[locale]/dashboard/purchase-requests/actions.ts), since that's the
// only real (non-placeholder) payment integration in this codebase; the
// customer pays it from their dashboard via
// createAdditionalChargeCheckoutSession() in app/[locale]/dashboard/actions.ts,
// and the Square webhook marks it paid.
export async function createAdditionalCharge(
  packageId: string,
  reason: string,
  amountCents: number,
) {
  const supabase = await requireAdmin()

  const trimmedReason = reason.trim()
  if (!trimmedReason) {
    return { error: "理由を入力してください。" }
  }
  if (!amountCents || amountCents <= 0) {
    return { error: "正しい金額を入力してください。" }
  }

  const {
    data: { user: admin },
  } = await supabase.auth.getUser()

  const { data: pkg, error: pkgError } = await supabase
    .from("packages")
    .select("id, user_id, item_name")
    .eq("id", packageId)
    .single()

  if (pkgError || !pkg || !pkg.user_id) {
    return { error: "荷物が見つかりません。" }
  }

  const { error: insertError } = await supabase.from("additional_charges").insert({
    user_id: pkg.user_id,
    package_id: packageId,
    reason: trimmedReason,
    amount_cents: amountCents,
    status: "pending",
    created_by: admin?.id ?? null,
  })

  if (insertError) {
    return { error: insertError.message }
  }

  await notifyUser(supabase, {
    userId: pkg.user_id,
    packageId,
    title: "追加料金のご請求について",
    body: `${pkg.item_name} について追加料金 $${formatUSD(
      amountCents / 100,
    )} をご請求いたします。理由: ${trimmedReason} ダッシュボードからお支払いください。`,
    titleEn: "Additional charge for your package",
    bodyEn: `An additional charge of $${formatUSD(
      amountCents / 100,
    )} has been issued for "${pkg.item_name}". Reason: ${trimmedReason}. Please pay from your dashboard.`,
  })

  revalidatePath("/admin/packages")
  revalidatePath("/dashboard")
  return { success: true }
}

export async function deletePackage(packageId: string) {
  const supabase = await requireAdmin()

  // Un-match any pre-declarations linked to this package before deleting it.
  // matched_package_id is ON DELETE SET NULL, so the link would clear on its
  // own, but the declaration's status would stay stuck at "matched" with no
  // package to find it by -- orphaning it from both the Pending Declarations
  // list and the matched-package view on the admin page. Resetting status
  // back to "pending" here lets the admin re-match it after deletion.
  const { error: unmatchError } = await supabase
    .from("package_declarations")
    .update({ status: "pending", matched_package_id: null, updated_at: new Date().toISOString() })
    .eq("matched_package_id", packageId)

  if (unmatchError) {
    return { error: unmatchError.message }
  }

  const { error } = await supabase.from("packages").delete().eq("id", packageId)

  if (error) {
    return { error: error.message }
  }

  revalidatePath("/admin/packages")
  return { success: true }
}

