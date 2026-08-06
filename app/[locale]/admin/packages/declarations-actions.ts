"use server"

import { revalidatePath } from "next/cache"
import { createClient } from "@/lib/supabase/server"

export async function markDeclarationMatched(id: string) {
  const supabase = await createClient()

  const { error } = await supabase
    .from("package_declarations")
    .update({ status: "matched", updated_at: new Date().toISOString() })
    .eq("id", id)

  if (error) {
    return { error: error.message }
  }

  revalidatePath("/admin/packages")
  return { success: true }
}
