"use server"

import { revalidatePath } from "next/cache"
import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"

// Links a customer's pre-declaration to the actual arrived package it
// describes. Previously this only flipped the declaration's status without
// ever writing matched_package_id, so the declaration silently dropped off
// the pending list with no way to find the order it referred to -- admins
// could not bill shipping or build a commercial invoice for it. Now the
// admin must pick which arrived package this declaration corresponds to,
// and that link is persisted so the order stays discoverable afterward.
export async function markDeclarationMatched(declarationId: string, packageId: string) {
  const supabase = await createClient()

  const { data: declaration, error: declarationError } = await supabase
    .from("package_declarations")
    .select("user_id")
    .eq("id", declarationId)
    .single()

  if (declarationError || !declaration) {
    return { error: "事前申告が見つかりません。" }
  }

  const { data: pkg, error: pkgError } = await supabase
    .from("packages")
    .select("user_id")
    .eq("id", packageId)
    .single()

  if (pkgError || !pkg) {
    return { error: "紐づける荷物が見つかりません。" }
  }

  if (pkg.user_id !== declaration.user_id) {
    return { error: "この荷物は別のお客様のものです。" }
  }

  const { error } = await supabase
    .from("package_declarations")
    .update({
      status: "matched",
      matched_package_id: packageId,
      updated_at: new Date().toISOString(),
    })
    .eq("id", declarationId)

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
