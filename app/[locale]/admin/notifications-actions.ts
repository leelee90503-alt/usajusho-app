"use server"

import { revalidatePath } from "next/cache"
import { createClient } from "@/lib/supabase/server"

// Mirrors dashboard/actions.ts's markNotificationRead / markAllNotificationsRead,
// but revalidates the admin dashboard instead of the customer dashboard. RLS
// already scopes these updates to the caller's own notification rows (see
// "Users can mark their own notifications as read" in notifications-schema.sql),
// so no extra is_admin check is needed here - an admin can only ever touch
// their own notifications through this action either way.

export async function markAdminNotificationRead(notificationId: string) {
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

  revalidatePath("/admin")
  return { success: true }
}

export async function markAllAdminNotificationsRead() {
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

  revalidatePath("/admin")
  return { success: true }
}
