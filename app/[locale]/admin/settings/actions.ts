"use server"

import { redirect } from '@/i18n/navigation'
import { getLocale } from 'next-intl/server'
import { revalidatePath } from "next/cache"
import { createClient } from "@/lib/supabase/server"

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

export async function saveEmailSettings(formData: FormData) {
  const supabase = await requireAdmin()

  const resendApiKey = String(formData.get("resend_api_key") || "").trim()

  const { error } = await supabase
    .from("email_settings")
    .update({
      resend_api_key: resendApiKey || null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", 1)

  if (error) {
    return { error: error.message }
  }

  revalidatePath("/admin/settings")
  return { success: true }
}
