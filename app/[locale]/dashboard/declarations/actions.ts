"use server"

import { revalidatePath } from "next/cache"
import { createClient } from "@/lib/supabase/server"
import { notifyAdmins, notifyUser } from "@/lib/notifications"
import { shippingEmailSteps } from "@/lib/email-template"
import { summarizeItemNames } from "@/lib/package-items"

type DeclaredItemInput = { product_name: string; quantity: number; unit_price: number | null }

// Parses the JSON array the client packs into the "items" field (see
// declaration-form.tsx). Anything malformed/empty is treated the same as
// "no items" rather than throwing -- the caller turns that into a normal
// validation error message instead of a 500.
function parseItems(raw: FormDataEntryValue | null): DeclaredItemInput[] {
  if (typeof raw !== "string" || !raw.trim()) return []
  let parsed: unknown
  try {
    parsed = JSON.parse(raw)
  } catch {
    return []
  }
  if (!Array.isArray(parsed)) return []

  const items: DeclaredItemInput[] = []
  for (const entry of parsed) {
    if (!entry || typeof entry !== "object") continue
    const productName = String((entry as Record<string, unknown>).product_name ?? "").trim()
    if (!productName) continue
    const quantityRaw = Number((entry as Record<string, unknown>).quantity)
    const quantity = Number.isFinite(quantityRaw) && quantityRaw > 0 ? Math.floor(quantityRaw) : 1
    const unitPriceRaw = (entry as Record<string, unknown>).unit_price
    const unitPrice =
      unitPriceRaw === null || unitPriceRaw === undefined || unitPriceRaw === ""
        ? null
        : Number(unitPriceRaw)
    items.push({
      product_name: productName,
      quantity,
      unit_price: unitPrice !== null && Number.isFinite(unitPrice) ? unitPrice : null,
    })
  }
  return items
}

export async function createDeclaration(formData: FormData) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { error: "ログインしてください。" }
  }

  const items = parseItems(formData.get("items"))
  const origin_tracking_number = String(formData.get("origin_tracking_number") || "").trim()
  const note = String(formData.get("note") || "").trim()
  const receipt = formData.get("receipt") as File | null

  if (items.length === 0) {
    return { error: "少なくとも1つの品目を入力してください。" }
  }

  // package_declarations.item_name/order_amount stay the single source of
  // truth for every place that only knows about a "one item per
  // declaration" world (admin lists, notifications, emails) -- they're
  // derived here as a summary/sum of the itemized rows rather than
  // removed, so nothing downstream needs to change.
  const item_name = summarizeItemNames(items.map((i) => i.product_name))
  const hasAnyPrice = items.some((i) => i.unit_price !== null)
  const order_amount = hasAnyPrice
    ? Math.round(items.reduce((sum, i) => sum + i.quantity * (i.unit_price ?? 0), 0) * 100) / 100
    : null

  let receipt_path: string | null = null
  if (receipt && receipt.size > 0) {
    const ext = receipt.name.includes(".") ? receipt.name.split(".").pop() : "bin"
    const path = `${user.id}/${crypto.randomUUID()}.${ext}`
    const { error: uploadError } = await supabase.storage
      .from("package-receipts")
      .upload(path, receipt, { contentType: receipt.type || undefined })

    if (uploadError) {
      return { error: uploadError.message }
    }
    receipt_path = path
  }

  const { data: declaration, error } = await supabase
    .from("package_declarations")
    .insert({
      user_id: user.id,
      item_name,
      order_amount,
      origin_tracking_number: origin_tracking_number || null,
      note: note || null,
      receipt_path,
    })
    .select("id")
    .single()

  if (error || !declaration) {
    return { error: error?.message ?? "事前申告の登録に失敗しました。" }
  }

  // Best-effort, same as package_items in matchAndQuoteDeclaration: never
  // block the declaration itself on this (e.g. if
  // declaration-items-migration.sql hasn't been run yet in this
  // environment) -- it's the itemized breakdown behind item_name/
  // order_amount above, which are already saved and correct on their own.
  const { error: itemsError } = await supabase.from("declaration_items").insert(
    items.map((i, index) => ({
      declaration_id: declaration.id,
      product_name: i.product_name,
      quantity: i.quantity,
      unit_price: i.unit_price,
      sort_order: index,
    }))
  )

  if (itemsError) {
    console.warn("createDeclaration: could not save declaration_items:", itemsError.message)
  }

  await notifyAdmins({
    title: "新しい荷物の事前申告が届きました",
    body: `${item_name} の事前申告が届きました。管理画面からご確認ください。`,
    titleEn: "New package pre-declaration received",
    bodyEn: `A new pre-declaration has been submitted for "${item_name}". Please check the admin dashboard.`,
  })
  await notifyUser(supabase, {
    userId: user.id,
    title: "事前申告を受け付けました",
    body: `"${item_name}" の事前申告を受け付けました。商品が倉庫に到着次第、担当者が確認のうえあらためてご連絡いたします。`,
    titleEn: "Your package declaration has been received",
    bodyEn: `We've received your pre-declaration for "${item_name}". Our team will confirm it once the item arrives at our warehouse.`,
    emailDetails: { itemName: item_name },
    emailSteps: shippingEmailSteps({ hasPackage: false }),
    emailCtaLabel: "ダッシュボードで確認する",
  })

  revalidatePath("/dashboard/declarations")
  return { success: true }
}

// Lets a customer fill in (or correct) the tracking number and/or note on a
// declaration they already submitted. Only allowed while the declaration is
// still "pending" - the underlying RLS update policy enforces this too, so
// this is defense in depth, not the only guard. When something actually
// changed, the admins are notified so they know to look at it again.
export async function updateDeclarationDetails(
  id: string,
  values: { origin_tracking_number: string; note: string }
) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { error: "ログインしてください。" }
  }

  const origin_tracking_number = values.origin_tracking_number.trim()
  const note = values.note.trim()

  const { data: existing } = await supabase
    .from("package_declarations")
    .select("item_name, origin_tracking_number, note, status")
    .eq("id", id)
    .eq("user_id", user.id)
    .single()

  if (!existing) {
    return { error: "Declaration not found." }
  }

  if (existing.status !== "pending") {
    return { error: "This declaration can no longer be edited." }
  }

  const { error } = await supabase
    .from("package_declarations")
    .update({
      origin_tracking_number: origin_tracking_number || null,
      note: note || null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)
    .eq("user_id", user.id)

  if (error) {
    return { error: error.message }
  }

  const changed =
    (existing.origin_tracking_number || "") !== origin_tracking_number ||
    (existing.note || "") !== note

  if (changed) {
    await notifyAdmins({
      title: "事前申告に追加情報が入力されました",
      body: `${existing.item_name} の事前申告に追跡番号またはメモが追加・変更されました。管理画面からご確認ください。`,
      titleEn: "Pre-declaration updated with additional info",
      bodyEn: `The tracking number or note for the pre-declaration "${existing.item_name}" has been added or changed. Please check the admin dashboard.`,
    })
  }

  revalidatePath("/dashboard/declarations")
  return { success: true }
}
