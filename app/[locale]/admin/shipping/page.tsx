import { redirect, Link } from '@/i18n/navigation'
import { createClient } from "@/lib/supabase/server"
import { getLocale, getTranslations } from 'next-intl/server'
import ShippingForm from "./shipping-form"
import { Button } from "@/components/ui/button"

export default async function AdminShippingPage() {
  const locale = await getLocale()
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    redirect({ href: "/login", locale })
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("is_admin")
    .eq("id", user!.id)
    .single()

  if (!profile?.is_admin) {
    redirect({ href: "/dashboard", locale })
  }

  const { data: settings } = await supabase
    .from("shipping_settings")
    .select("*")
    .eq("id", 1)
    .single()

  const t = await getTranslations('adminShipping')

  return (
    <main>
      <div className="mx-auto max-w-2xl px-6 py-10">
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-2xl font-bold text-slate-900">{t("title")}</h1>
          <Button asChild variant="ghost" size="sm">
            <Link href="/admin/packages">{t("backLink")}</Link>
          </Button>
        </div>
        <p className="mb-6 text-sm text-slate-600">{t("description")}</p>
        <ShippingForm initialSettings={settings ?? null} />
      </div>
    </main>
  )
}
