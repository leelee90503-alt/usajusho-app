"use server"

import { revalidatePath } from "next/cache"
import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { requireAdmin } from "./actions"
import { notifyUser } from "@/lib/notifications"
import { calculateChargeableWeight } from "@/lib/pricing"

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
  }
) {
  const supabase = await requireAdmin()

  const { data: declaration, error: declarationError } = await supabase
    .from("package_declarations")
    .select("id, user_id, item_name, status")
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

  const { error: matchError } = await supabase
    .from("package_declarations")
    .update({
      status: "matched",
      matched_package_id: newPackage.id,
      updated_at: new Date().toISOString(),
    })
    .eq("id", declarationId)

  if (matchError) {
    return { error: matchError.message }
  }

  await notifyUser(supabase, {
    userId: declaration.user_id,
    packageId: newPackage.id,
    title: "送料の見積りが届きました",
    body: `${itemName} の送料見積り ¥${params.quoteAmount.toLocaleString()} が届きました。${
      memo ? `メモ: ${memo} ` : ""
    }ダッシュボードからお支払いください。`,
    titleEn: "Your shipping quote is ready",
    bodyEn: `Your shipping quote of ¥${params.quoteAmount.toLocaleString()} for "${itemName}" is ready.${
      memo ? ` Note: ${memo}.` : ""
    } Please pay from your dashboard.`,
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
