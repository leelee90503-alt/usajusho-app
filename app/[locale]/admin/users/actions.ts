"use server"

import { redirect } from '@/i18n/navigation'
import { getLocale } from 'next-intl/server'
import { revalidatePath } from "next/cache"
import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"

async function requireAdmin() {
  const locale = await getLocale()
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    redirect({ href: "/login", locale })
    return
  }
  const { data: profile } = await supabase
    .from("profiles")
    .select("is_admin")
    .eq("id", user.id)
    .single()
  if (!profile?.is_admin) {
    redirect({ href: "/dashboard", locale })
  }
}

// Both actions below use the service-role admin client (see
// lib/supabase/admin.ts) because updating another user's email or password
// requires the Supabase Auth Admin API - there is no way to do this as a
// regular authenticated user, even an admin one, through the normal client.
// requireAdmin() gates access before either ever runs.

export async function adminUpdateUserEmail(userId: string, newEmail: string) {
  await requireAdmin()

  const email = newEmail.trim()
  if (!email) {
    return { error: "Email is required." }
  }

  const adminSupabase = createAdminClient()
  const { error } = await adminSupabase.auth.admin.updateUserById(userId, {
    email,
    email_confirm: true,
  })

  if (error) {
    return { error: error.message }
  }

  // Keep profiles.email in sync - lib/notifications.ts sends real package
  // update emails to that column, not to auth.users directly.
  await adminSupabase.from("profiles").update({ email }).eq("id", userId)

  revalidatePath("/admin/users")
  return { success: true }
}

export async function adminUpdateUserContactInfo(
  userId: string,
  fields: {
    phone_number: string
    japan_postal_code: string
    japan_prefecture: string
    japan_city: string
    japan_address_line1: string
    japan_address_line2: string
  }
) {
  await requireAdmin()

  const supabase = await createClient()
  const { error } = await supabase
    .from("profiles")
    .update({
      phone_number: fields.phone_number.trim() || null,
      japan_postal_code: fields.japan_postal_code.trim() || null,
      japan_prefecture: fields.japan_prefecture.trim() || null,
      japan_city: fields.japan_city.trim() || null,
      japan_address_line1: fields.japan_address_line1.trim() || null,
      japan_address_line2: fields.japan_address_line2.trim() || null,
    })
    .eq("id", userId)

  if (error) {
    return { error: error.message }
  }

  revalidatePath(`/admin/users/${userId}`)
  return { success: true }
}

export async function adminResetUserPassword(userId: string, newPassword: string) {
  await requireAdmin()

  if (!newPassword || newPassword.length < 6) {
    return { error: "Password must be at least 6 characters." }
  }

  const adminSupabase = createAdminClient()
  const { error } = await adminSupabase.auth.admin.updateUserById(userId, {
    password: newPassword,
  })

  if (error) {
    return { error: error.message }
  }

  revalidatePath("/admin/users")
  return { success: true }
}
