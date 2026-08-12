import { redirect, Link } from '@/i18n/navigation'
import { createClient } from "@/lib/supabase/server"
import { getLocale, getTranslations } from 'next-intl/server'
import AddPackageForm from "./add-package-form"
import PackageRow from "./package-row"
import PendingDeclarations from "./pending-declarations"
import MissingPackages from "./missing-packages"
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
    { value: "missing", label: t("filterMissing") },
    { value: "quoted", label: t("filterQuoted") },
    { value: "paid", label: t("filterPaid") },
    { value: "shipped", label: t("filterShipped") },
  ]

  const { q = "", status = "" } = await searchParams

  const { data: allPackages } = await supabase
    .from("packages")
    .select("*, profiles(full_name, suite_number, phone_number, japan_postal_code, japan_prefecture, japan_city, japan_address_line1, japan_address_line2)")
    .order("created_at", { ascending: false })

  const packages = allPackages ?? []

  // Fetch every declaration (not just pending ones) so already-matched
  // declarations can be looked up by their linked package below -- the
  // order info they carry (declared value, origin tracking) is what lets
  // admins bill shipping and build the commercial invoice for that package.
  const { data: allDeclarations } = await supabase
    .from("package_declarations")
    .select("*, profiles(full_name, suite_number)")
    .order("created_at", { ascending: false })

  const declarations = allDeclarations ?? []
  const pendingDeclarationsRaw = declarations.filter((d) => d.status === "pending")
  const matchedDeclarations = declarations.filter(
    (d) => d.status === "matched" && d.matched_package_id
  )
  const declarationByPackageId = new Map(
    matchedDeclarations.map((d) => [d.matched_package_id as string, d])
  )

  const missingPackages = packages.filter((p) => p.status === "missing")

  // Consolidation (합송배송/묶음배송): a pending declaration can be matched
  // straight into an existing not-yet-paid package for the same customer
  // instead of always creating a new one -- see the "existing package"
  // dropdown in pending-declarations.tsx. Candidates are that customer's
  // packages still open for changes (missing = not yet weighed/quoted,
  // quoted = weighed but not yet paid).
  const attachableCandidatesByUserId = new Map<
    string,
    { id: string; item_name: string; status: string }[]
  >()
  for (const pkg of packages) {
    if (!pkg.user_id) continue
    if (pkg.status !== "missing" && pkg.status !== "quoted") continue
    const list = attachableCandidatesByUserId.get(pkg.user_id) ?? []
    list.push({ id: pkg.id, item_name: pkg.item_name, status: pkg.status })
    attachableCandidatesByUserId.set(pkg.user_id, list)
  }

  const declarationsWithUrls = await Promise.all(
    pendingDeclarationsRaw.map(async (d) => {
      let receipt_url: string | null = null
      if (d.receipt_path) {
        const { data: signed } = await supabase.storage
          .from("package-receipts")
          .createSignedUrl(d.receipt_path, 60 * 60)
        receipt_url = signed?.signedUrl ?? null
      }
      return {
        ...d,
        receipt_url,
        candidatePackages: attachableCandidatesByUserId.get(d.user_id) ?? [],
      }
    })
  )

  const { data: activeRates } = await supabase
    .from("shipping_rates")
    .select("*")
    .eq("is_active", true)

  const rates = activeRates ?? []

  const { count: userCount } = await supabase
    .from("profiles")
    .select("*", { count: "exact", head: true })

  const { data: allInvoices } = await supabase
    .from("invoices")
    .select("id, package_id, status")

  const invoiceByPackageId = new Map((allInvoices ?? []).map((inv) => [inv.package_id, inv]))

  const { data: allAdditionalCharges } = await supabase
    .from("additional_charges")
    .select("id, package_id, reason, amount_cents, status")
    .order("created_at", { ascending: false })

  type AdditionalCharge = {
    id: string
    package_id: string
    reason: string
    amount_cents: number
    status: string
  }

  const additionalChargesByPackageId = new Map<string, AdditionalCharge[]>()
  for (const charge of (allAdditionalCharges ?? []) as AdditionalCharge[]) {
    const list = additionalChargesByPackageId.get(charge.package_id) ?? []
    list.push(charge)
    additionalChargesByPackageId.set(charge.package_id, list)
  }

  // Inspection photos attached when the quote was issued (see
  // resolveMissingPackage() in ./actions.ts and package-photos-migration.sql).
  // Signed so the private "package-photos" bucket can be viewed here too.
  const { data: allPackagePhotos } = await supabase
    .from("package_photos")
    .select("id, package_id, storage_path")
    .order("created_at", { ascending: true })

  const photosByPackageId = new Map<string, { id: string; url: string }[]>()
  await Promise.all(
    (allPackagePhotos ?? []).map(async (photo) => {
      const { data: signed } = await supabase.storage
        .from("package-photos")
        .createSignedUrl(photo.storage_path, 60 * 60)
      if (!signed?.signedUrl) return
      const list = photosByPackageId.get(photo.package_id) ?? []
      list.push({ id: photo.id, url: signed.signedUrl })
      photosByPackageId.set(photo.package_id, list)
    })
  )

  // Per-item breakdown for consolidated (합송배송) packages -- see
  // package-items-migration.sql. Only rendered when a package has more
  // than one item; a single-item package's item_name already says it all.
  const { data: allPackageItems } = await supabase
    .from("package_items")
    .select("id, package_id, product_name, quantity")
    .order("sort_order", { ascending: true })

  type PackageItemRow = { id: string; package_id: string; product_name: string; quantity: number }

  const itemsByPackageId = new Map<string, PackageItemRow[]>()
  for (const item of (allPackageItems ?? []) as PackageItemRow[]) {
    const list = itemsByPackageId.get(item.package_id) ?? []
    list.push(item)
    itemsByPackageId.set(item.package_id, list)
  }

  const statCounts = {
    total: packages.length,
    missing: packages.filter((p) => p.status === "missing").length,
    quoted: packages.filter((p) => p.status === "quoted").length,
    paid: packages.filter((p) => p.status === "paid").length,
    shipped: packages.filter((p) => p.status === "shipped").length,
  }

  const query = q.trim().toLowerCase()
  const filteredPackages = packages.filter((pkg) => {
    const matchesStatus = !status || pkg.status === status
    const matchesQuery =
      !query ||
      pkg.id?.toLowerCase() === query ||
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
              <Link href="/admin">{t("homeLink")}</Link>
            </Button>
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
            <Button asChild variant="ghost" size="sm">
              <Link href="/admin/users">{t("usersLink")}</Link>
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
              <p className="text-2xl font-bold text-destructive">{statCounts.missing}</p>
              <p className="mt-1 text-xs text-muted-foreground">{t("statMissing")}</p>
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
              <p className="text-2xl font-bold text-foreground">{statCounts.paid}</p>
              <p className="mt-1 text-xs text-muted-foreground">{t("statPaid")}</p>
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

        <PendingDeclarations declarations={declarationsWithUrls} rates={rates} />

        <MissingPackages packages={missingPackages} rates={rates} />

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
              <PackageRow
                key={pkg.id}
                pkg={pkg}
                invoice={invoiceByPackageId.get(pkg.id) ?? null}
                declaration={declarationByPackageId.get(pkg.id) ?? null}
                additionalCharges={additionalChargesByPackageId.get(pkg.id) ?? []}
                photos={photosByPackageId.get(pkg.id) ?? []}
                items={itemsByPackageId.get(pkg.id) ?? []}
              />
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
