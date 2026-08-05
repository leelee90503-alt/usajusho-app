import { redirect, Link } from '@/i18n/navigation'
import { createClient } from "@/lib/supabase/server"
import { getLocale, getTranslations } from 'next-intl/server'
import SettingsForm from "./settings-form"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

export default async function AdminSettingsPage() {
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

  const { data: settings } = await supabase
    .from("email_settings")
    .select("resend_api_key")
    .eq("id", 1)
    .maybeSingle()

  const t = await getTranslations('adminSettings')

  return (
    <main className="min-h-screen bg-[var(--usj-surface)]">
      <div className="mx-auto max-w-2xl px-6 py-10">
        <div className="mb-1 flex items-center justify-between">
          <h1 className="text-xl font-bold text-primary">{t("title")}</h1>
          <Button asChild variant="ghost" size="sm">
            <Link href="/admin/packages">{t("backLink")}</Link>
          </Button>
        </div>
        <p className="mb-6 text-sm text-muted-foreground">
          {t("description")}
        </p>

        <Card className="mb-6">
          <CardContent className="py-6">
            <h2 className="mb-3 text-sm font-semibold text-foreground">{t("setupHeading")}</h2>
            <ol className="list-inside list-decimal space-y-2 text-sm text-muted-foreground">
              <li>{t("step1")}</li>
              <li>{t("step2")}</li>
              <li>{t("step3")}</li>
            </ol>
          </CardContent>
        </Card>

        <SettingsForm initialSettings={settings ?? null} />
      </div>
    </main>
  )
}
