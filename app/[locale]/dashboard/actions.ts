"use server"

import { revalidatePath } from "next/cache"
import { createClient } from "@/lib/supabase/server"
import { notifyAdmins } from "@/lib/notifications"

export async function payForShipment(packageId: string) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { error: "ログインしてください。" }
  }

  // NOTE: Square is not yet connected. This marks the package as paid directly
  // as a stand-in for a real checkout flow. Swap this for a Square Payment
  // Link + webhook once payment credentials are available.
  const { error } = await supabase
    .from("packages")
    .update({ status: "paid", updated_at: new Date().toISOString() })
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
