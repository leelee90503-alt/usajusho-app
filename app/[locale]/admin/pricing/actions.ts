"use server"

import { revalidatePath } from "next/cache"
import { createClient } from "@/lib/supabase/server"
import { redirect } from "@/i18n/navigation"
import { getLocale } from "next-intl/server"

async function requireAdmin() {
  const locale = await getLocale()
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect({ href: "/login", locale })
    return undefined as never
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("is_admin")
    .eq("id", user.id)
    .single()

  if (!profile?.is_admin) {
    redirect({ href: "/dashboard", locale })
    return undefined as never
  }

  return supabase
}

export async function createRate(formData: FormData) {
  const supabase = await requireAdmin()

  const label = String(formData.get("label") || "").trim()
  const minWeightKg = Number(formData.get("min_weight_kg"))
  const maxWeightRaw = String(formData.get("max_weight_kg") || "").trim()
  const maxWeightKg = maxWeightRaw === "" ? null : Number(maxWeightRaw)
  const pricePerKg = Number(formData.get("price_per_kg"))
  const minCharge = Number(formData.get("min_charge") || 0)

  if (!label) {
    return { error: "ラベルを入力してください。" }
  }
  if (Number.isNaN(minWeightKg) || minWeightKg < 0) {
    return { error: "最小重量を正しく入力してください。" }
  }
  if (maxWeightKg !== null && (Number.isNaN(maxWeightKg) || maxWeightKg <= minWeightKg)) {
    return { error: "最大重量は最小重量より大きい値にしてください。" }
  }
  if (Number.isNaN(pricePerKg) || pricePerKg < 0) {
    return { error: "kg単価を正しく入力してください。" }
  }

  const { error } = await supabase.from("shipping_rates").insert({
    label,
    min_weight_kg: minWeightKg,
    max_weight_kg: maxWeightKg,
    price_per_kg: pricePerKg,
    min_charge: Number.isNaN(minCharge) ? 0 : minCharge,
  })

  if (error) {
    return { error: error.message }
  }

  revalidatePath("/admin/pricing")
  return { success: true }
}

export async function updateRate(rateId: string, formData: FormData) {
  const supabase = await requireAdmin()

  const label = String(formData.get("label") || "").trim()
  const minWeightKg = Number(formData.get("min_weight_kg"))
  const maxWeightRaw = String(formData.get("max_weight_kg") || "").trim()
  const maxWeightKg = maxWeightRaw === "" ? null : Number(maxWeightRaw)
  const pricePerKg = Number(formData.get("price_per_kg"))
  const minCharge = Number(formData.get("min_charge") || 0)

  if (!label) {
    return { error: "ラベルを入力してください。" }
  }
  if (Number.isNaN(minWeightKg) || minWeightKg < 0) {
    return { error: "最小重量を正しく入力してください。" }
  }
  if (maxWeightKg !== null && (Number.isNaN(maxWeightKg) || maxWeightKg <= minWeightKg)) {
    return { error: "最大重量は最小重量より大きい値にしてください。" }
  }
  if (Number.isNaN(pricePerKg) || pricePerKg < 0) {
    return { error: "kg単価を正しく入力してください。" }
  }

  const { error } = await supabase
    .from("shipping_rates")
    .update({
      label,
      min_weight_kg: minWeightKg,
      max_weight_kg: maxWeightKg,
      price_per_kg: pricePerKg,
      min_charge: Number.isNaN(minCharge) ? 0 : minCharge,
      updated_at: new Date().toISOString(),
    })
    .eq("id", rateId)

  if (error) {
    return { error: error.message }
  }

  revalidatePath("/admin/pricing")
  return { success: true }
}

export async function toggleRateActive(rateId: string, isActive: boolean) {
  const supabase = await requireAdmin()

  const { error } = await supabase
    .from("shipping_rates")
    .update({ is_active: isActive, updated_at: new Date().toISOString() })
    .eq("id", rateId)

  if (error) {
    return { error: error.message }
  }

  revalidatePath("/admin/pricing")
  return { success: true }
}

export async function deleteRate(rateId: string) {
  const supabase = await requireAdmin()

  const { error } = await supabase.from("shipping_rates").delete().eq("id", rateId)

  if (error) {
    return { error: error.message }
  }

  revalidatePath("/admin/pricing")
  return { success: true }
}
