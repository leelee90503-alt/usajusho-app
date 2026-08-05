import { redirect, Link } from '@/i18n/navigation'
import { createClient } from "@/lib/supabase/server"
import { getLocale, getTranslations } from 'next-intl/server'
import AddPackageForm from "./add-package-form"
import PackageRow from "./package-row"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

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
    <main className="min-h-screen bg-[var(--usj-surface)]">
      <div className="mx-auto max-w-4xl px-6 py-10">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h1 className="text-xl font-bold text-primary">{t("title")}</h1>
          <nav className="flex items-center gap-1">
            <Button asChild variant="ghost" size="sm">
              <Link href="/admin/pricing">{t("pricingLink")}</Link>
            </Button>
            <Button asChild variant="ghost" size="sm">
              <Link href="/admin/settings">{t("settingsLink")}</Link>
            </Button>
            <Button asChild variant="ghost" size="sm">
              <Link href="/admin/shipping">{t("shippingLink")}</Link>
            </Button>
            <Button asChild variant="ghost" size="sm">
              <Link href="/admin/purchase-requests">{t("purchaseRequestsLink")}</Link>
            </Button>
          </nav>
        </div>
        <p className="mt-1 text-sm text-muted-foreground">
          {t("description")}
        </p>

        <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-6">
          <Card>
            <CardContent className="py-3 text-center">
              <p className="text-2xl font-bold text-foreground">{statCounts.total}</p>
              <p className="mt-1 text-xs text-muted-foreground">{t("statTotal")}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="py-3 text-center">
              <p className="text-2xl font-bold text-foreground">{userCount ?? 0}</p>
              <p className="mt-1 text-xs text-muted-foreground">{t("statUsers")}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="py-3 text-center">
              <p className="text-2xl font-bold text-accent">{statCounts.arrived}</p>
              <p className="mt-1 text-xs text-muted-foreground">{t("statArrived")}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="py-3 text-center">
              <p className="text-2xl font-bold text-accent">{statCounts.requested}</p>
              <p className="mt-1 text-xs text-muted-foreground">{t("statRequested")}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="py-3 text-center">
              <p className="text-2xl font-bold text-amber-700">{statCounts.quoted}</p>
              <p className="mt-1 text-xs text-muted-foreground">{t("statQuoted")}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="py-3 text-center">
              <p className="text-2xl font-bold text-foreground">{statCounts.shipped}</p>
              <p className="mt-1 text-xs text-muted-foreground">{t("statShipped")}</p>
            </CardContent>
          </Card>
        </div>

        <div className="mt-6">
          <AddPackageForm />
        </div>

        <div className="mt-10">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-lg font-semibold text-foreground">
              {t("allPackages", { count: filteredPackages.length })}
            </h2>

            <form className="flex flex-wrap items-center gap-2" method="get">
              <Input
                type="text"
                name="q"
                defaultValue={q}
                placeholder={t("searchPlaceholder")}
                className="w-48"
              />
              <select
                name="status"
                defaultValue={status}
                className="h-8 rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
              >
                {STATUS_FILTERS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
              <Button type="submit" size="sm">
                {t("searchButton")}
              </Button>
              {(q || status) && (
                <Button asChild variant="link" size="sm" className="text-muted-foreground">
                  <Link href="/admin/packages">{t("clear")}</Link>
                </Button>
              )}
            </form>
          </div>

          <div className="mt-3 space-y-3">
            {filteredPackages.map((pkg) => (
              <PackageRow key={pkg.id} pkg={pkg} rates={rates} />
            ))}

            {filteredPackages.length === 0 && (
              <Card className="border-dashed">
                <CardContent className="py-8 text-center text-sm text-muted-foreground">
                  {packages.length === 0 ? t("emptyNone") : t("emptyFiltered")}
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </main>
  )
}
