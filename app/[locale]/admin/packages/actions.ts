"use server"

import { redirect } from '@/i18n/navigation'
import { getLocale } from 'next-intl/server'
import { revalidatePath } from "next/cache"
import { createClient } from "@/lib/supabase/server"
import { notifyUser } from "@/lib/notifications"
import { calculateChargeableWeight } from "@/lib/pricing"

async function requireAdmin(): Promise<Awaited<ReturnType<typeof createClient>>> {
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

export async function addPackage(formData: FormData) {
  const supabase = await requireAdmin()

  const suiteNumber = String(formData.get("suite_number") || "").trim()
  const itemName = String(formData.get("item_name") || "").trim()
  const trackingNumber = String(formData.get("tracking_number") || "").trim()
  const weightKgRaw = formData.get("weight_kg")
  const lengthCmRaw = formData.get("length_cm")
  const widthCmRaw = formData.get("width_cm")
  const heightCmRaw = formData.get("height_cm")
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

  const weightKg = weightKgRaw ? Number(weightKgRaw) : null
  const lengthCm = lengthCmRaw ? Number(lengthCmRaw) : null
  const widthCm = widthCmRaw ? Number(widthCmRaw) : null
  const heightCm = heightCmRaw ? Number(heightCmRaw) : null

  const { volumetricWeightKg, chargeableWeightKg } = calculateChargeableWeight({
    weightKg,
    lengthCm,
    widthCm,
    heightCm,
  })

  const { error: insertError } = await supabase.from("packages").insert({
    user_id: profile.id,
    item_name: itemName,
    tracking_number: trackingNumber || null,
    weight_kg: weightKg,
    length_cm: lengthCm,
    width_cm: widthCm,
    height_cm: heightCm,
    volumetric_weight_kg: volumetricWeightKg || null,
    chargeable_weight_kg: chargeableWeightKg || null,
    admin_note: adminNote || null,
    status: "arrived",
  })

  if (insertError) {
    return { error: insertError.message }
  }

  await notifyUser(supabase, {
    userId: profile.id,
    title: "荷物が届きました",
    body: `${itemName} が届きました。ダッシュボードからご確認ください。`,
  })

  revalidatePath("/admin/packages")
  return { success: true }
}

export async function updatePackageStatus(packageId: string, status: string) {
  const supabase = await requireAdmin()

  // Shipping a package without ever recording an outbound tracking number
  // left customers with no way to track their delivery. Block the raw
  // status dropdown from jumping straight to "shipped" unless a tracking
  // number is already on file -- the normal path is the "preparing
  // shipment" panel's markShipped() below, which collects the tracking
  // number and sets this status together.
  if (status === "shipped") {
    const { data: current, error: fetchError } = await supabase
      .from("packages")
      .select("tracking_number")
      .eq("id", packageId)
      .single()

    if (fetchError) {
      return { error: fetchError.message }
    }

    if (!current?.tracking_number?.trim()) {
      return { error: "発送完了にする前に、配送追跡番号を入力してください。" }
    }
  }

  const { data: updated, error } = await supabase
    .from("packages")
    .update({ status, updated_at: new Date().toISOString() })
    .eq("id", packageId)
    .select("user_id, item_name, tracking_number")
    .single()

  if (error) {
    return { error: error.message }
  }

  if (status === "shipped" && updated) {
    await notifyUser(supabase, {
      userId: updated.user_id,
      packageId,
      title: "発送が完了しました",
      body: `${updated.item_name} の発送が完了しました。追跡番号: ${updated.tracking_number}`,
    })
  }

  revalidatePath("/admin/packages")
  revalidatePath("/dashboard")
  return { success: true }
}

// Primary path for completing a shipment: collects the outbound tracking
// number (US warehouse -> customer's Japan address) and moves the package
// to "shipped" in one step, so a shipment is never marked complete without
// a tracking number attached.
export async function markShipped(packageId: string, trackingNumber: string) {
  const supabase = await requireAdmin()

  const trimmed = trackingNumber.trim()
  if (!trimmed) {
    return { error: "配送追跡番号を入力してください。" }
  }

  const { data: updated, error } = await supabase
    .from("packages")
    .update({
      tracking_number: trimmed,
      status: "shipped",
      updated_at: new Date().toISOString(),
    })
    .eq("id", packageId)
    .select("user_id, item_name")
    .single()

  if (error) {
    return { error: error.message }
  }

  if (updated) {
    await notifyUser(supabase, {
      userId: updated.user_id,
      packageId,
      title: "発送が完了しました",
      body: `${updated.item_name} の発送が完了しました。追跡番号: ${trimmed}`,
    })
  }

  revalidatePath("/admin/packages")
  revalidatePath("/dashboard")
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

  const { data: updated, error } = await supabase
    .from("packages")
    .update({
      quote_amount: quoteAmount,
      quote_note: quoteNote || null,
      status: "quoted",
      updated_at: new Date().toISOString(),
    })
    .eq("id", packageId)
    .select("user_id, item_name")
    .single()

  if (error) {
    return { error: error.message }
  }

  if (updated) {
    await notifyUser(supabase, {
      userId: updated.user_id,
      packageId,
      title: "送料の見積りが届きました",
      body: `${updated.item_name} の送料見積り ¥${quoteAmount.toLocaleString()} が届きました。ダッシュボードからお支払いください。`,
    })
  }

  revalidatePath("/admin/packages")
  revalidatePath("/dashboard")
  return { success: true }
}
