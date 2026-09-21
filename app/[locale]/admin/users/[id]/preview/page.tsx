import { redirect, Link } from "@/i18n/navigation"
import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { getLocale, getTranslations } from "next-intl/server"
import PackageList from "@/app/[locale]/dashboard/package-list"
import PendingOrderList from "@/app/[locale]/dashboard/pending-order-list"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { MapPin, ArrowLeft, Eye } from "lucide-react"

// Read-only "view as customer" preview for admins: renders the exact same
// dashboard components a customer sees (PendingOrderList / PackageList),
// but fed with the target customer's own data instead of the logged-in
// admin's. Payment is disabled by always passing squareConfig={null}, so
// the Square card-payment forms simply don't render here -- on top of that,
// every payment server action (payShipmentWithCard, etc. in
// dashboard/actions.ts) already scopes its query with
// .eq("user_id", user.id) using the ADMIN's own session, so even a
// hypothetical stray payment attempt from this page would fail rather than
// charge the customer. This route is purely a read-only mirror.
export default async function AdminUserDashboardPreviewPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const locale = await getLocale()
  const supabase = await createClient()
  const { id } = await params

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect({ href: "/login", locale })
    return
  }

  const { data: viewerProfile } = await supabase
    .from("profiles")
    .select("is_admin")
    .eq("id", user.id)
    .single()

  if (!viewerProfile?.is_admin) {
    redirect({ href: "/dashboard", locale })
    return
  }

  const t = await getTranslations("dashboard")
  const tAdmin = await getTranslations("adminUserDetail")

  // Service-role client: this page intentionally reads another user's
  // data, which the normal per-user RLS-scoped client can't do.
  const adminSupabase = createAdminClient()

  const { data: profile } = await adminSupabase
    .from("profiles")
    .select("*")
    .eq("id", id)
    .single()

  if (!profile) {
    return (
      <main className="min-h-screen bg-[var(--usj-surface)]">
        <div className="mx-auto max-w-3xl px-6 py-10">
          <Link
            href={`/admin/users/${id}`}
            className="inline-flex items-center gap-1 text-sm text-accent hover:underline"
          >
            <ArrowLeft className="h-4 w-4" />
            {tAdmin("previewBackLink")}
          </Link>
          <Card className="mt-6 border-dashed">
            <CardContent className="py-8 text-center text-sm text-muted-foreground">
              {tAdmin("notFound")}
            </CardContent>
          </Card>
        </div>
      </main>
    )
  }

  const { data: authUser } = await adminSupabase.auth.admin.getUserById(id)
  const email = authUser?.user?.email ?? profile.email ?? ""

  const { data: shippingSettings } = await adminSupabase
    .from("shipping_settings")
    .select("suite_number_enabled")
    .eq("id", 1)
    .single()

  const { data: packages } = await adminSupabase
    .from("packages")
    .select("*")
    .eq("user_id", id)
    .order("created_at", { ascending: false })

  const { data: declarations } = await adminSupabase
    .from("package_declarations")
    .select("*")
    .eq("user_id", id)
    .order("created_at", { ascending: false })

  const { data: purchaseRequests } = await adminSupabase
    .from("purchase_requests")
    .select("*")
    .eq("user_id", id)
    .order("created_at", { ascending: false })

  const pendingPackages = (packages ?? []).filter((pkg) => pkg.status !== "shipped")
  const completedPackages = (packages ?? []).filter((pkg) => pkg.status === "shipped")
  const pendingDeclarations = (declarations ?? []).filter((d) => d.status === "pending")
  const pendingPurchaseRequests = (purchaseRequests ?? []).filter(
    (r) => !["purchased", "cancelled", "refunded"].includes(r.status),
  )

  const pendingOrderCount =
    pendingPackages.length + pendingDeclarations.length + pendingPurchaseRequests.length

  const { data: additionalChargesData } = await adminSupabase
    .from("additional_charges")
    .select("id, package_id, reason, amount_cents, status")
    .eq("user_id", id)
    .in("status", ["pending", "awaiting_payment"])
    .order("created_at", { ascending: false })

  type AdditionalCharge = {
    id: string
    package_id: string
    reason: string
    amount_cents: number
    status: string
  }

  const additionalChargesByPackageId: Record<string, AdditionalCharge[]> = {}
  for (const charge of (additionalChargesData ?? []) as AdditionalCharge[]) {
    const list = additionalChargesByPackageId[charge.package_id] ?? []
    list.push(charge)
    additionalChargesByPackageId[charge.package_id] = list
  }

  const packageIds = (packages ?? []).map((pkg) => pkg.id)
  const { data: packagePhotosData } =
    packageIds.length > 0
      ? await adminSupabase
          .from("package_photos")
          .select("id, package_id, storage_path")
          .in("package_id", packageIds)
          .order("created_at", { ascending: true })
      : { data: [] as { id: string; package_id: string; storage_path: string }[] }

  const photosByPackageId: Record<string, { id: string; url: string }[]> = {}
  await Promise.all(
    (packagePhotosData ?? []).map(async (photo) => {
      const { data: signed } = await adminSupabase.storage
        .from("package-photos")
        .createSignedUrl(photo.storage_path, 60 * 60)
      if (!signed?.signedUrl) return
      const list = photosByPackageId[photo.package_id] ?? []
      list.push({ id: photo.id, url: signed.signedUrl })
      photosByPackageId[photo.package_id] = list
    }),
  )

  const { data: invoiceStatusRows } =
    packageIds.length > 0
      ? await adminSupabase.from("invoices").select("package_id, status").in("package_id", packageIds)
      : { data: [] as { package_id: string; status: string }[] }

  const invoiceStatusByPackageId: Record<string, string> = {}
  for (const invoice of invoiceStatusRows ?? []) {
    invoiceStatusByPackageId[invoice.package_id] = invoice.status
  }

  const { data: packageItemsData } =
    packageIds.length > 0
      ? await adminSupabase
          .from("package_items")
          .select("id, package_id, product_name, quantity")
          .in("package_id", packageIds)
          .order("sort_order", { ascending: true })
      : { data: [] as { id: string; package_id: string; product_name: string; quantity: number }[] }

  const itemsByPackageId: Record<string, { id: string; product_name: string; quantity: number }[]> = {}
  for (const item of packageItemsData ?? []) {
    const list = itemsByPackageId[item.package_id] ?? []
    list.push(item)
    itemsByPackageId[item.package_id] = list
  }

  return (
    <main className="min-h-screen bg-[var(--usj-surface)]">
      <div className="sticky top-0 z-10 border-b border-amber-300 bg-amber-50 px-6 py-3">
        <div className="mx-auto flex max-w-3xl flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2 text-sm font-semibold text-amber-900">
            <Eye className="h-4 w-4" />
            {tAdmin("previewBannerTitle", { name: profile.full_name || email })}
          </div>
          <Link
            href={`/admin/users/${id}`}
            className="inline-flex items-center gap-1 text-sm font-medium text-amber-900 hover:underline"
          >
            <ArrowLeft className="h-4 w-4" />
            {tAdmin("previewBackLink")}
          </Link>
        </div>
        <p className="mx-auto mt-1 max-w-3xl text-xs text-amber-800">{tAdmin("previewBannerNote")}</p>
      </div>

      <div className="mx-auto max-w-3xl px-6 py-10">
        <div className="mt-2">
          <h2 className="text-2xl font-bold text-slate-900">
            {t("welcome", { name: profile?.full_name || email })}
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">{email}</p>
        </div>

        {profile && (
          <Card className="mt-8">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-sm font-semibold text-primary">
                <MapPin className="h-4 w-4" />
                {t("myAddress")} / Your US Address
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-0.5 text-sm text-slate-700">
              <p>{profile.full_name}</p>
              <p>{profile.us_address_line1}</p>
              {shippingSettings?.suite_number_enabled && (
                <p className="font-semibold">{profile.us_address_line2}</p>
              )}
              <p>
                {profile.us_city}, {profile.us_state} {profile.us_zip}
              </p>
              <p>United States</p>
              <p className="pt-3 text-xs text-muted-foreground">{t("addressNote")}</p>
            </CardContent>
          </Card>
        )}

        <div className="mt-8">
          <h3 className="text-lg font-semibold text-slate-900">{t("myPackages")}</h3>
          <Tabs defaultValue="pending" className="mt-3">
            <TabsList>
              <TabsTrigger value="pending">
                {t("tabPending")} ({pendingOrderCount})
              </TabsTrigger>
              <TabsTrigger value="completed">
                {t("tabCompleted")} ({completedPackages.length})
              </TabsTrigger>
            </TabsList>
            <TabsContent value="pending">
              <PendingOrderList
                packages={pendingPackages.map((pkg) => ({ kind: "package" as const, ...pkg }))}
                declarations={pendingDeclarations.map((d) => ({ kind: "declaration" as const, ...d }))}
                purchaseRequests={pendingPurchaseRequests.map((r) => ({
                  kind: "purchaseRequest" as const,
                  ...r,
                }))}
                profile={profile ?? null}
                additionalCharges={additionalChargesByPackageId}
                photosByPackageId={photosByPackageId}
                invoiceStatusByPackageId={invoiceStatusByPackageId}
                itemsByPackageId={itemsByPackageId}
                squareConfig={null}
              />
            </TabsContent>
            <TabsContent value="completed">
              <PackageList
                packages={completedPackages}
                profile={profile ?? null}
                emptyVariant="completed"
                additionalCharges={additionalChargesByPackageId}
                photosByPackageId={photosByPackageId}
                invoiceStatusByPackageId={invoiceStatusByPackageId}
                itemsByPackageId={itemsByPackageId}
                squareConfig={null}
              />
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </main>
  )
}
