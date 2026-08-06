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
  })

  revalidatePath("/dashboard/declarations")
  return { success: true }
}

export async function deleteDeclaration(id: string) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { error: "ログインしてください。" }
  }

  const { data: declaration } = await supabase
    .from("package_declarations")
    .select("receipt_path")
    .eq("id", id)
    .eq("user_id", user.id)
    .single()

  const { error } = await supabase
    .from("package_declarations")
    .delete()
    .eq("id", id)
    .eq("user_id", user.id)

  if (error) {
    return { error: error.message }
  }

  if (declaration?.receipt_path) {
    await supabase.storage.from("package-receipts").remove([declaration.receipt_path])
  }

  revalidatePath("/dashboard/declarations")
  return { success: true }
}
