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

export async function saveEmailSettings(formData: FormData) {
  const supabase = await requireAdmin()

  const emailjsServiceId = String(formData.get("emailjs_service_id") || "").trim()
  const emailjsTemplateId = String(formData.get("emailjs_template_id") || "").trim()
  const emailjsPublicKey = String(formData.get("emailjs_public_key") || "").trim()
  const emailjsPrivateKey = String(formData.get("emailjs_private_key") || "").trim()

  const { error } = await supabase
    .from("email_settings")
    .update({
      emailjs_service_id: emailjsServiceId || null,
      emailjs_template_id: emailjsTemplateId || null,
      emailjs_public_key: emailjsPublicKey || null,
      emailjs_private_key: emailjsPrivateKey || null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", 1)

  if (error) {
    return { error: error.message }
  }

  revalidatePath("/admin/settings")
  return { success: true }
}
