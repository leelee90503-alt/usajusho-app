"use server"

import { redirect } from "next/navigation"
import { revalidatePath } from "next/cache"
import { createClient } from "@/lib/supabase/server"

async function requireAdmin() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/login")
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("is_admin")
    .eq("id", user.id)
    .single()

  if (!profile?.is_admin) {
    redirect("/dashboard")
  }

  return supabase
}

export async function addPackage(formData: FormData) {
  const supabase = await requireAdmin()

  const suiteNumber = String(formData.get("suite_number") || "").trim()
  const itemName = String(formData.get("item_name") || "").trim()
  const trackingNumber = String(formData.get("tracking_number") || "").trim()
  const weightLbs = formData.get("weight_lbs")
  const adminNote = String(formData.get("admin_note") || "").trim()

  if (!suiteNumber || !itemName) {
    return { error: "スイート番号と品名は必須です。" }
  }

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("id")
    .eq("suite_number", suiteNumber)
    .single()

  if (profileError || !profile) {
    return { error: `スイート番号 ${suiteNumber} のユーザーが見つかりません。` }
  }

  const { error: insertError } = await supabase.from("packages").insert({
    user_id: profile.id,
    item_name: itemName,
    tracking_number: trackingNumber || null,
    weight_lbs: weightLbs ? Number(weightLbs) : null,
    admin_note: adminNote || null,
    status: "arrived",
  })

  if (insertError) {
    return { error: insertError.message }
  }

  revalidatePath("/admin/packages")
  return { success: true }
}

export async function updatePackageStatus(packageId: string, status: string) {
  const supabase = await requireAdmin()

  const { error } = await supabase
    .from("packages")
    .update({ status, updated_at: new Date().toISOString() })
    .eq("id", packageId)

  if (error) {
    return { error: error.message }
  }

  revalidatePath("/admin/packages")
  return { success: true }
}

export async function deletePackage(packageId: string) {
  const supabase = await requireAdmin()

  const { error } = await supabase.from("packages").delete().eq("id", packageId)

  if (error) {
    return { error: error.message }
  }

  revalidatePath("/admin/packages")
  return { success: true }
}

export async function submitQuote(packageId: string, quoteAmount: number, quoteNote: string) {
  const supabase = await requireAdmin()

  const { error } = await supabase
    .from("packages")
    .update({
      quote_amount: quoteAmount,
      quote_note: quoteNote || null,
      status: "quoted",
      updated_at: new Date().toISOString(),
    })
    .eq("id", packageId)

  if (error) {
    return { error: error.message }
  }

  revalidatePath("/admin/packages")
  revalidatePath("/dashboard")
  return { success: true }
}
