"use server"

import { revalidatePath } from "next/cache"
import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { requireAdmin } from "./actions"
import { notifyUser } from "@/lib/notifications"
import { calculateChargeableWeight } from "@/lib/pricing"
import { formatUSD } from "@/lib/format"
import { shippingEmailSteps } from "@/lib/email-template"
import { summarizeItemNames } from "@/lib/package-items"

// Primary path for handling a physical package arrival: the admin finds the
// matching pending pre-declaration, enters the item's actual weight/size/
// tracking info, and sends the shipping quote -- all in one action. This
// creates the package record (there was no "arrived, unmatched" package to
// link to; the declaration itself is the order) and moves it straight to
// "quoted", skipping the old separate arrival/matching step entirely.
export async function matchAndQuoteDeclaration(
  declarationId: string,
  params: {
    itemName: string
    weightKg: number | null
    lengthCm: number | null
    widthCm: number | null
    heightCm: number | null
    trackingNumber: string
    memo: string
    quoteAmount: number
    // Consolidation (합송배송/묶음배송): when set, this declaration's item
    // joins an existing not-yet-paid package for the same customer instead
    // of creating a brand new package. weightKg/lengthCm/... are expected
    // to be the admin's re-measurement of the whole combined box.
    existingPackageId?: string | null
  }
) {
  const supabase = await requireAdmin()

  const { data: declaration, error: declarationError } = await supabase
    .from("package_declarations")
    .select("id, user_id, item_name, order_amount, status")
    .eq("id", declarationId)
    .single()

  if (declarationError || !declaration) {
    return { error: "事前申告が見つかりません。" }
  }

  if (declaration.status !== "pending") {
    return { error: "この事前申告はすでに処理済みです。" }
  }

  if (!params.quoteAmount || params.quoteAmount <= 0) {
    return { error: "正しい見積金額を入力してください。" }
  }

  const itemName = params.itemName.trim() || declaration.item_name

  const { volumetricWeightKg, chargeableWeightKg } = calculateChargeableWeight({
    weightKg: params.weightKg,
    lengthCm: params.lengthCm,
    widthCm: params.widthCm,
    heightCm: params.heightCm,
  })

  const memo = params.memo.trim() || null

  let packageId: string

  if (params.existingPackageId) {
    const { data: existingPackage, error: existingPackageError } = await supabase
      .from("packages")
      .select("id, user_id, status")
      .eq("id", params.existingPackageId)
      .single()

    if (existingPackageError || !existingPackage) {
      return { error: "合送先の荷物が見つかりません。" }
    }

    if (existingPackage.user_id !== declaration.user_id) {
      return { error: "合送先の荷物の持ち主が一致しません。" }
    }

    if (!["missing", "quoted"].includes(existingPackage.status)) {
      return { error: "この荷物にはすでに合送できません（支払い済みまたは発送済みです）。" }
    }

    packageId = existingPackage.id

    const { error: updateError } = await supabase
      .from("packages")
      .update({
        weight_kg: params.weightKg,
        length_cm: params.lengthCm,
        width_cm: params.widthCm,
        height_cm: params.heightCm,
        volumetric_weight_kg: volumetricWeightKg || null,
        chargeable_weight_kg: chargeableWeightKg || null,
        tracking_number: params.trackingNumber.trim() || null,
        admin_note: memo,
        quote_amount: params.quoteAmount,
        quote_note: memo,
        status: "quoted",
        updated_at: new Date().toISOString(),
      })
      .eq("id", packageId)

    if (updateError) {
      return { error: updateError.message }
    }
  } else {
    const { data: newPackage, error: insertError } = await supabase
      .from("packages")
      .insert({
        user_id: declaration.user_id,
        item_name: itemName,
        tracking_number: params.trackingNumber.trim() || null,
        weight_kg: params.weightKg,
        length_cm: params.lengthCm,
        width_cm: params.widthCm,
        height_cm: params.heightCm,
        volumetric_weight_kg: volumetricWeightKg || null,
        chargeable_weight_kg: chargeableWeightKg || null,
        admin_note: memo,
        quote_amount: params.quoteAmount,
        quote_note: memo,
        status: "quoted",
      })
      .select("id")
      .single()

    if (insertError || !newPackage) {
      return { error: insertError?.message ?? "荷物の登録に失敗しました。" }
    }

    packageId = newPackage.id
  }

  // Best-effort: records this declaration's line item(s) for the package's
  // item breakdown (customer dashboard, admin package view, invoice
  // import). Never blocks the match/quote itself on this -- it's a display
  // enhancement, not something the core shipping flow depends on, so a
  // failure here (e.g. package-items-migration.sql hasn't been run yet)
  // shouldn't stop the admin from quoting the customer.
  //
  // Declarations submitted through the itemized form (declaration-items-
  // migration.sql) have one or more declaration_items rows -- copy each of
  // those over so a multi-product order keeps its per-item quantity/price
  // breakdown all the way through to the package and, later, the
  // commercial invoice. Older declarations (submitted before that
  // migration, or if it hasn't been run yet) have none, so fall back to a
  // single row summarizing item_name/order_amount as before.
  const { data: sourceItems } = await supabase
    .from("declaration_items")
    .select("product_name, quantity, unit_price, sort_order")
    .eq("declaration_id", declarationId)
    .order("sort_order", { ascending: true })

  const packageItemRows =
    sourceItems && sourceItems.length > 0
      ? sourceItems.map((item) => ({
          package_id: packageId,
          source_declaration_id: declarationId,
          product_name: item.product_name,
          quantity: item.quantity,
          unit_price: item.unit_price,
        }))
      : [
          {
            package_id: packageId,
            source_declaration_id: declarationId,
            product_name: itemName,
            quantity: 1,
            unit_price: declaration.order_amount,
          },
        ]

  const { error: itemInsertError } = await supabase.from("package_items").insert(packageItemRows)

  if (itemInsertError) {
    console.warn("matchAndQuoteDeclaration: could not record package_items row(s):", itemInsertError.message)
  }

  // When consolidating, packages.item_name (the headline shown everywhere)
  // should summarize everything now inside the box, not just the item that
  // was just added.
  let finalItemName = itemName
  if (params.existingPackageId) {
    const { data: allItems } = await supabase
      .from("package_items")
      .select("product_name")
      .eq("package_id", packageId)
      .order("created_at", { ascending: true })

    finalItemName = summarizeItemNames((allItems ?? []).map((i) => i.product_name)) || itemName

    const { error: nameUpdateError } = await supabase
      .from("packages")
      .update({ item_name: finalItemName })
      .eq("id", packageId)

    if (nameUpdateError) {
      return { error: nameUpdateError.message }
    }
  }

  const { error: matchError } = await supabase
    .from("package_declarations")
    .update({
      status: "matched",
      matched_package_id: packageId,
      updated_at: new Date().toISOString(),
    })
    .eq("id", declarationId)

  if (matchError) {
    return { error: matchError.message }
  }

  await notifyUser(supabase, {
    userId: declaration.user_id,
    packageId,
    title: "送料の見積りが届きました",
    body: `${finalItemName} の送料お見積りをお送りいたします。お見積り金額は $${formatUSD(params.quoteAmount)} です。${
      memo ? `担当者より一言：${memo} ` : ""
    }内容をご確認のうえ、ダッシュボードよりお支払いのお手続きをお願いいたします。`,
    titleEn: "Your shipping quote is ready",
    bodyEn: `Your shipping quote of $${formatUSD(params.quoteAmount)} for "${finalItemName}" is ready.${
      memo ? ` Note: ${memo}.` : ""
    } Please pay from your dashboard.`,
    emailDetails: {
      itemName: finalItemName,
      trackingNumber: params.trackingNumber.trim() || null,
      weightKg: params.weightKg,
      amountCaption: "送料お見積り金額",
      amountLabel: `$${formatUSD(params.quoteAmount)} USD`,
      statusBadge: "お支払いをお待ちしております",
    },
    emailSteps: shippingEmailSteps({ hasPackage: true, packageStatus: "quoted" }),
    emailCtaLabel: "ダッシュボードでお支払い手続きへ",
  })

  revalidatePath("/admin/packages")
  revalidatePath("/dashboard")
  return { success: true }
}

// Admin-only delete. RLS already allows admins to delete any
// package_declarations row via the regular (session-scoped) client, but the
// storage RLS on the package-receipts bucket only grants admins SELECT on
// other users' receipts - not DELETE - so removing the uploaded file needs
// the service-role admin client instead.
export async function adminDeleteDeclaration(id: string) {
  const supabase = await createClient()

  const { data: declaration, error: fetchError } = await supabase
    .from("package_declarations")
    .select("receipt_path")
    .eq("id", id)
    .single()

  if (fetchError) {
    return { error: fetchError.message }
  }

  const { error } = await supabase.from("package_declarations").delete().eq("id", id)

  if (error) {
    return { error: error.message }
  }

  if (declaration?.receipt_path) {
    try {
      const adminSupabase = createAdminClient()
      await adminSupabase.storage.from("package-receipts").remove([declaration.receipt_path])
    } catch (err) {
      console.warn(
        "adminDeleteDeclaration: could not remove receipt file (admin client unavailable):",
        err instanceof Error ? err.message : err
      )
    }
  }

  revalidatePath("/admin/packages")
  return { success: true }
}
