import { redirect, Link } from '@/i18n/navigation'
import { createClient } from "@/lib/supabase/server"
import { getLocale, getTranslations } from 'next-intl/server'
import SettingsForm from "./settings-form"

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
    .select("emailjs_service_id, emailjs_template_id, emailjs_public_key, emailjs_private_key")
    .eq("id", 1)
    .maybeSingle()

  const t = await getTranslations('adminSettings')

  return (
    <main className="min-h-screen bg-slate-50">
      <div className="mx-auto max-w-2xl px-6 py-10">
        <div className="flex items-center justify-between mb-1">
          <h1 className="text-xl font-bold text-slate-900">{t("title")}</h1>
          <Link href="/admin/packages" className="text-sm text-teal-700 hover:underline">
            {t("backLink")}
          </Link>
        </div>
        <p className="text-sm text-slate-500 mb-6">
          {t("description")}
        </p>

        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 mb-6">
          <h2 className="text-sm font-semibold text-slate-900 mb-3">{t("setupHeading")}</h2>
          <ol className="text-sm text-slate-600 space-y-2 list-decimal list-inside">
            <li>{t("step1")}</li>
            <li>
              {t("step2Pre")}{" "}
              <code className="bg-slate-100 px-1 rounded">to_email</code>,{" "}
              <code className="bg-slate-100 px-1 rounded">to_name</code>,{" "}
              <code className="bg-slate-100 px-1 rounded">subject</code>,{" "}
              <code className="bg-slate-100 px-1 rounded">message</code> {t("step2Post")}
            </li>
            <li>
              {t("step3Pre")} {t("step3Post")}
            </li>
            <li>{t("step4")}</li>
          </ol>
        </div>

        <SettingsForm initialSettings={settings ?? null} />
      </div>
    </main>
  )
}
