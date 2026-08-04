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
