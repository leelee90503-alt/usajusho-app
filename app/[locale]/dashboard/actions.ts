"use server"

import { revalidatePath } from "next/cache"
import { createClient } from "@/lib/supabase/server"
import { notifyAdmins } from "@/lib/notifications"

export async function requestShipment(packageIds: string[]) {
  if (!packageIds || packageIds.length === 0) {
    return { error: "発送する荷物を選択してください。" }
  }

  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { error: "ログインしてください。" }
  }

  const { error } = await supabase
    .from("packages")
    .update({ status: "requested", updated_at: new Date().toISOString() })
    .in("id", packageIds)
    .eq("user_id", user.id)
    .eq("status", "arrived")

  if (error) {
    return { error: error.message }
  }

  await notifyAdmins({
    title: "発送リクエストが届きました",
    body: `${packageIds.length}件の荷物について発送リクエストが届きました。管理画面からご確認ください。`,
    titleEn: "New shipment request received",
    bodyEn: `A shipment request has been submitted for ${packageIds.length} package(s). Please check the admin dashboard.`,
  })

  revalidatePath("/dashboard")
  revalidatePath("/admin/packages")

  return { success: true }
}

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
