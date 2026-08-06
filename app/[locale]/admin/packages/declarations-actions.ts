"use server"

import { revalidatePath } from "next/cache"
import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"

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
