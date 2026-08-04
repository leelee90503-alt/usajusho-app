import { redirect } from "@/i18n/navigation"
import { getLocale, getTranslations } from "next-intl/server"
import { createClient } from "@/lib/supabase/server"
import Link from "next/link"
import RateRow from "./rate-row"
import AddRateForm from "./add-rate-form"

export default async function AdminPricingPage() {
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
    return
  }

  const t = await getTranslations("adminPricing")

  const { data: rates } = await supabase
    .from("shipping_rates")
    .select("*")
    .order("min_weight_kg", { ascending: true })

  const rateList = rates ?? []

  return (
    <main className="min-h-screen bg-slate-50">
      <div className="mx-auto max-w-3xl px-6 py-10">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-bold text-slate-900">{t("title")}</h1>
          <Link href="/admin/packages" className="text-sm text-teal-700 hover:underline">
            {t("backToPackages")}
          </Link>
        </div>
        <p className="mt-1 text-sm text-slate-500">{t("description")}</p>

        <div className="mt-6 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-sm font-semibold text-slate-900">{t("addHeading")}</h2>
          <AddRateForm />
        </div>

        <div className="mt-8">
          <h2 className="text-lg font-semibold text-slate-900">
            {t("listHeading", { count: rateList.length })}
          </h2>

          <div className="mt-3 space-y-3">
            {rateList.map((rate) => (
              <RateRow key={rate.id} rate={rate} />
            ))}

            {rateList.length === 0 && (
              <div className="rounded-xl border border-dashed border-slate-300 bg-white p-8 text-center text-sm text-slate-500">
                {t("empty")}
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  )
}
