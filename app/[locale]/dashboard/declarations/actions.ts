"use server"

import { revalidatePath } from "next/cache"
import { createClient } from "@/lib/supabase/server"
import { notifyAdmins } from "@/lib/notifications"

export async function createDeclaration(formData: FormData) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { error: "ログインしてください。" }
  }

  const item_name = String(formData.get("item_name") || "").trim()
  const order_amount_raw = String(formData.get("order_amount") || "").trim()
  const origin_tracking_number = String(formData.get("origin_tracking_number") || "").trim()
  const note = String(formData.get("note") || "").trim()
  const receipt = formData.get("receipt") as File | null

  if (!item_name) {
    return { error: "Item name is required." }
  }

  const order_amount = order_amount_raw ? Number(order_amount_raw) : null
  if (order_amount !== null && Number.isNaN(order_amount)) {
    return { error: "Invalid order amount." }
  }

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

  const { error } = await supabase.from("package_declarations").insert({
    user_id: user.id,
    item_name,
    order_amount,
    origin_tracking_number: origin_tracking_number || null,
    note: note || null,
    receipt_path,
  })

  if (error) {
    return { error: error.message }
  }

  await notifyAdmins({
    title: "新しい荷物の事前申告が届きました",
    body: `${item_name} の事前申告が届きました。管理画面からご確認ください。`,
    titleEn: "New package pre-declaration received",
    bodyEn: `A new pre-declaration has been submitted for "${item_name}". Please check the admin dashboard.`,
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
