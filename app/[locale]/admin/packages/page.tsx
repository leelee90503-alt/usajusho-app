import { redirect, Link } from '@/i18n/navigation'
import { createClient } from "@/lib/supabase/server"
import { getLocale, getTranslations } from 'next-intl/server'
import AddPackageForm from "./add-package-form"
import PackageRow from "./package-row"

export default async function AdminPackagesPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; status?: string }>
}) {
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

  const t = await getTranslations('adminPackages')

  const STATUS_FILTERS = [
    { value: "", label: t("filterAll") },
    { value: "arrived", label: t("filterArrived") },
    { value: "requested", label: t("filterRequested") },
    { value: "quoted", label: t("filterQuoted") },
    { value: "paid", label: t("filterPaid") },
    { value: "shipped", label: t("filterShipped") },
  ]

  const { q = "", status = "" } = await searchParams

  const { data: allPackages } = await supabase
    .from("packages")
    .select("*, profiles(full_name, suite_number)")
    .order("created_at", { ascending: false })

  const { data: activeRates } = await supabase
    .from("shipping_rates")
    .select("*")
    .eq("is_active", true)

  const rates = activeRates ?? []

  const { count: userCount } = await supabase
    .from("profiles")
    .select("*", { count: "exact", head: true })

  const packages = allPackages ?? []

  const statCounts = {
    total: packages.length,
    arrived: packages.filter((p) => p.status === "arrived").length,
    requested: packages.filter((p) => p.status === "requested").length,
    quoted: packages.filter((p) => p.status === "quoted").length,
    paid: packages.filter((p) => p.status === "paid").length,
    shipped: packages.filter((p) => p.status === "shipped").length,
  }

  const query = q.trim().toLowerCase()
  const filteredPackages = packages.filter((pkg) => {
    const matchesStatus = !status || pkg.status === status
    const matchesQuery =
      !query ||
      pkg.item_name?.toLowerCase().includes(query) ||
      pkg.tracking_number?.toLowerCase().includes(query) ||
      pkg.profiles?.full_name?.toLowerCase().includes(query) ||
      pkg.profiles?.suite_number?.toLowerCase().includes(query)
    return matchesStatus && matchesQuery
  })

  return (
    <main className="min-h-screen bg-slate-50">
      <div className="mx-auto max-w-4xl px-6 py-10">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-bold text-slate-900">{t("title")}</h1>
            <Link href="/admin/pricing" className="text-sm text-teal-700 hover:underline">
              {t("pricingLink")}
            </Link>
          <Link href="/admin/settings" className="text-sm text-teal-700 hover:underline">
            {t("settingsLink")}
          </Link>
        </div>
        <p className="mt-1 text-sm text-slate-500">
          {t("description")}
        </p>

        <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-6">
          <div className="rounded-xl border border-slate-200 bg-white p-3 text-center shadow-sm">
            <p className="text-2xl font-bold text-slate-900">{statCounts.total}</p>
            <p className="mt-1 text-xs text-slate-500">{t("statTotal")}</p>
          </div>
          <div className="rounded-xl border border-slate-200 bg-white p-3 text-center shadow-sm">
            <p className="text-2xl font-bold text-slate-900">{userCount ?? 0}</p>
            <p className="mt-1 text-xs text-slate-500">{t("statUsers")}</p>
          </div>
          <div className="rounded-xl border border-slate-200 bg-white p-3 text-center shadow-sm">
            <p className="text-2xl font-bold text-teal-700">{statCounts.arrived}</p>
            <p className="mt-1 text-xs text-slate-500">{t("statArrived")}</p>
          </div>
          <div className="rounded-xl border border-slate-200 bg-white p-3 text-center shadow-sm">
            <p className="text-2xl font-bold text-teal-700">{statCounts.requested}</p>
            <p className="mt-1 text-xs text-slate-500">{t("statRequested")}</p>
          </div>
          <div className="rounded-xl border border-slate-200 bg-white p-3 text-center shadow-sm">
            <p className="text-2xl font-bold text-amber-700">{statCounts.quoted}</p>
            <p className="mt-1 text-xs text-slate-500">{t("statQuoted")}</p>
          </div>
          <div className="rounded-xl border border-slate-200 bg-white p-3 text-center shadow-sm">
            <p className="text-2xl font-bold text-slate-700">{statCounts.shipped}</p>
            <p className="mt-1 text-xs text-slate-500">{t("statShipped")}</p>
          </div>
        </div>

        <div className="mt-6">
          <AddPackageForm />
        </div>

        <div className="mt-10">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-lg font-semibold text-slate-900">
              {t("allPackages", { count: filteredPackages.length })}
            </h2>

            <form className="flex flex-wrap items-center gap-2" method="get">
              <input
                type="text"
                name="q"
                defaultValue={q}
                placeholder={t("searchPlaceholder")}
                className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm"
              />
              <select
                name="status"
                defaultValue={status}
                className="rounded-lg border border-slate-300 px-2 py-1.5 text-sm"
              >
                {STATUS_FILTERS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
              <button
                type="submit"
                className="rounded-lg bg-slate-900 px-3 py-1.5 text-sm font-semibold text-white hover:bg-slate-800"
              >
                {t("searchButton")}
              </button>
              {(q || status) && (
                <Link
                  href="/admin/packages"
                  className="text-sm text-slate-500 underline hover:text-slate-700"
                >
                  {t("clear")}
                </Link>
              )}
            </form>
          </div>

          <div className="mt-3 space-y-3">
            {filteredPackages.map((pkg) => (
              <PackageRow key={pkg.id} pkg={pkg} rates={rates} />
            ))}

            {filteredPackages.length === 0 && (
              <div className="rounded-xl border border-dashed border-slate-300 bg-white p-8 text-center text-sm text-slate-500">
                {packages.length === 0
                  ? t("emptyNone")
                  : t("emptyFiltered")}
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  )
}
