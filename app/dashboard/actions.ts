"use server"

import { revalidatePath } from "next/cache"
import { createClient } from "@/lib/supabase/server"

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

  // NOTE: Stripe is not yet connected. This marks the package as paid directly
  // as a stand-in for a real checkout flow. Swap this for a Stripe Checkout
  // session + webhook once payment credentials are available.
  const { error } = await supabase
    .from("packages")
    .update({ status: "paid", updated_at: new Date().toISOString() })
    .eq("id", packageId)
    .eq("user_id", user.id)
    .eq("status", "quoted")

  if (error) {
    return { error: error.message }
  }

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
