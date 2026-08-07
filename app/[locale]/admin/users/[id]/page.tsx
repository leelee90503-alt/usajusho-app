import { redirect, Link } from "@/i18n/navigation"
import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { getLocale, getTranslations } from "next-intl/server"
import UserRow from "../user-row"
import CarrierTrackLink from "@/components/carrier-track-link"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft } from "lucide-react"

export default async function AdminUserDetailPage({
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

  const t = await getTranslations("adminUserDetail")
  const tPkgStatus = await getTranslations("packageStatus")
  const tDecl = await getTranslations("packageDeclarations")
  const tInvoices = await getTranslations("adminInvoices")
  const tPR = await getTranslations("adminPurchaseRequests")

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, full_name, suite_number, is_admin, email")
    .eq("id", id)
    .single()

  if (!profile) {
    return (
      <main className="min-h-screen bg-[var(--usj-surface)]">
        <div className="mx-auto max-w-4xl px-6 py-10">
          <Link
            href="/admin/users"
            className="inline-flex items-center gap-1 text-sm text-accent hover:underline"
          >
            <ArrowLeft className="h-4 w-4" />
            {t("backLink")}
          </Link>
          <Card className="mt-6 border-dashed">
            <CardContent className="py-8 text-center text-sm text-muted-foreground">
              {t("notFound")}
            </CardContent>
          </Card>
        </div>
      </main>
    )
  }

  const adminSupabase = createAdminClient()
  const { data: authUser } = await adminSupabase.auth.admin.getUserById(id)
  const email = authUser?.user?.email ?? profile.email ?? ""

  const [
    { data: packages },
    { data: declarations },
    { data: invoices },
    { data: purchaseRequests },
  ] = await Promise.all([
    supabase.from("packages").select("*").eq("user_id", id).order("created_at", { ascending: false }),
    supabase
      .from("package_declarations")
      .select("*")
      .eq("user_id", id)
      .order("created_at", { ascending: false }),
    supabase.from("invoices").select("*").eq("user_id", id).order("created_at", { ascending: false }),
    supabase
      .from("purchase_requests")
      .select("*")
      .eq("user_id", id)
      .order("created_at", { ascending: false }),
  ])

  const packageStatusLabels: Record<string, string> = {
    missing: tPkgStatus("missing"),
    quoted: tPkgStatus("quoted"),
    paid: tPkgStatus("paid"),
    shipped: tPkgStatus("shipped"),
  }

  const invoiceStatusLabels: Record<string, string> = {
    draft: tInvoices("statusDraft"),
    customer_submitted: tInvoices("statusSubmitted"),
    correction_required: tInvoices("statusCorrectionRequired"),
    admin_review: tInvoices("statusAdminReview"),
    complete: tInvoices("statusComplete"),
  }

  return (
    <main className="min-h-screen bg-[var(--usj-surface)]">
      <div className="mx-auto max-w-4xl px-6 py-10">
        <Link
          href="/admin/users"
          className="inline-flex items-center gap-1 text-sm text-accent hover:underline"
        >
          <ArrowLeft className="h-4 w-4" />
          {t("backLink")}
        </Link>

        <h1 className="mt-4 text-xl font-bold text-primary">{t("title")}</h1>

        <div className="mt-4">
          <UserRow
            user={{
              id: profile.id,
              full_name: profile.full_name,
              suite_number: profile.suite_number,
              is_admin: profile.is_admin,
              email,
            }}
            showViewDetails={false}
          />
        </div>

        <section className="mt-8">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-foreground">
              {t("packagesHeading", { count: packages?.length ?? 0 })}
            </h2>
            <Link href="/admin/packages" className="text-xs font-semibold text-accent hover:underline">
              {t("packagesLink")}
            </Link>
          </div>
          <div className="mt-3 space-y-3">
            {(packages ?? []).map((pkg) => (
              <Card key={pkg.id}>
                <CardContent className="py-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <p className="text-sm font-medium text-foreground">{pkg.item_name}</p>
                      {pkg.tracking_number && (
                        <p className="mt-0.5 text-xs text-muted-foreground">
                          {pkg.tracking_number}{" "}
                          <CarrierTrackLink trackingNumber={pkg.tracking_number} />
                        </p>
                      )}
                    </div>
                    <Badge variant="outline">
                      {packageStatusLabels[pkg.status] ?? pkg.status}
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            ))}
            {(!packages || packages.length === 0) && (
              <Card className="border-dashed">
                <CardContent className="py-6 text-center text-sm text-muted-foreground">
                  {t("packagesEmpty")}
                </CardContent>
              </Card>
            )}
          </div>
        </section>

        <section className="mt-8">
          <h2 className="text-lg font-semibold text-foreground">
            {t("declarationsHeading", { count: declarations?.length ?? 0 })}
          </h2>
          <div className="mt-3 space-y-3">
            {(declarations ?? []).map((d) => (
              <Card key={d.id}>
                <CardContent className="py-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <p className="text-sm font-medium text-foreground">{d.item_name}</p>
                      {d.origin_tracking_number && (
                        <p className="mt-0.5 text-xs text-muted-foreground">{d.origin_tracking_number}</p>
                      )}
                    </div>
                    <Badge variant="outline">{tDecl(`status.${d.status}`)}</Badge>
                  </div>
                </CardContent>
              </Card>
            ))}
            {(!declarations || declarations.length === 0) && (
              <Card className="border-dashed">
                <CardContent className="py-6 text-center text-sm text-muted-foreground">
                  {t("declarationsEmpty")}
                </CardContent>
              </Card>
            )}
          </div>
        </section>

        <section className="mt-8">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-foreground">
              {t("invoicesHeading", { count: invoices?.length ?? 0 })}
            </h2>
          </div>
          <div className="mt-3 space-y-3">
            {(invoices ?? []).map((inv) => (
              <Card key={inv.id}>
                <CardContent className="py-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <p className="text-sm font-medium text-foreground">{inv.invoice_number}</p>
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        {t("declaredValueLabel")}{" "}
                        {inv.total_declared_value != null
                          ? `$${Number(inv.total_declared_value).toLocaleString()}`
                          : "—"}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">
                        {invoiceStatusLabels[inv.status] ?? inv.status}
                      </Badge>
                      <Link
                        href={`/admin/invoices/${inv.package_id}`}
                        className="text-xs font-semibold text-accent hover:underline"
                      >
                        {t("invoicesViewLink")}
                      </Link>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
            {(!invoices || invoices.length === 0) && (
              <Card className="border-dashed">
                <CardContent className="py-6 text-center text-sm text-muted-foreground">
                  {t("invoicesEmpty")}
                </CardContent>
              </Card>
            )}
          </div>
        </section>

        <section className="mt-8">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-foreground">
              {t("purchaseRequestsHeading", { count: purchaseRequests?.length ?? 0 })}
            </h2>
            <Link
              href="/admin/purchase-requests"
              className="text-xs font-semibold text-accent hover:underline"
            >
              {t("purchaseRequestsLink")}
            </Link>
          </div>
          <div className="mt-3 space-y-3">
            {(purchaseRequests ?? []).map((pr) => (
              <Card key={pr.id}>
                <CardContent className="py-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="text-sm font-medium text-foreground">{pr.product_description}</p>
                    <Badge variant="outline">{tPR(`status.${pr.status}`)}</Badge>
                  </div>
                </CardContent>
              </Card>
            ))}
            {(!purchaseRequests || purchaseRequests.length === 0) && (
              <Card className="border-dashed">
                <CardContent className="py-6 text-center text-sm text-muted-foreground">
                  {t("purchaseRequestsEmpty")}
                </CardContent>
              </Card>
            )}
          </div>
        </section>
      </div>
    </main>
  )
}
