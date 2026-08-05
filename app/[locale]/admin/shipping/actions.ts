"use server"

import { getLocale } from 'next-intl/server'
import { redirect } from '@/i18n/navigation'
import { revalidatePath } from "next/cache"
import { createClient } from "@/lib/supabase/server"

async function requireAdmin(): Promise<Awaited<ReturnType<typeof createClient>>> {
  const locale = await getLocale()
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    redirect({ href: "/login", locale })
    return undefined as never
  }
  const { data: profile } = await supabase.from("profiles").select("is_admin").eq("id", user.id).single()
  if (!profile?.is_admin) {
    redirect({ href: "/dashboard", locale })
    return undefined as never
  }
  return supabase
}

export async function saveShippingSettings(formData: FormData) {
  const supabase = await requireAdmin()

  const base_address_line1 = String(formData.get("base_address_line1") || "").trim()
  const base_city = String(formData.get("base_city") || "").trim()
  const base_state = String(formData.get("base_state") || "").trim()
  const base_zip = String(formData.get("base_zip") || "").trim()
  const suite_number_enabled = formData.get("suite_number_enabled") === "true"
  const apply_to_existing = formData.get("apply_to_existing") === "true"

  if (!base_address_line1 || !base_city || !base_state || !base_zip) {
    return { error: "All address fields are required." }
  }

  const { error } = await supabase.from("shipping_settings").update({
    base_address_line1,
    base_city,
    base_state,
    base_zip,
    suite_number_enabled,
    updated_at: new Date().toISOString(),
  }).eq("id", 1)

  if (error) {
    return { error: error.message }
  }

  let updatedCount: number | null = null
  if (apply_to_existing) {
    const { data, error: rpcError } = await supabase.rpc(
      "admin_apply_shipping_address_to_existing_profiles",
      {
        p_line1: base_address_line1,
        p_city: base_city,
        p_state: base_state,
        p_zip: base_zip,
      }
    )
    if (rpcError) {
      return { error: rpcError.message }
    }
    updatedCount = data as number
  }

  revalidatePath("/admin/shipping")
  revalidatePath("/dashboard")
  return { success: true, updatedCount }
}
