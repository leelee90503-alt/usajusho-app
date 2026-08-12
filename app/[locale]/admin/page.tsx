import { redirect, Link } from '@/i18n/navigation'
import { createClient } from "@/lib/supabase/server"
import { getLocale, getTranslations } from 'next-intl/server'
import { ChevronRight } from 'lucide-react'
import NotificationPanel from "./notification-panel"
import { Card, CardContent } from "@/components/ui/card"

type FlowStep = {
  value: number
  label: string
  href: string
  accent: boolean
}

export default async function AdminHomePage() {
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

  const t = await getTranslations("adminHome")

  const [
    { count: userCount },
    { data: packageRows },
    { count: pendingDeclarationsCount },
    { data: purchaseRequestStatuses },
    { count: invoicesNeedReviewCount },
    { data: invoicedPackageRows },
    { data: notifications },
  ] = await Promise.all([
    supabase.from("profiles").select("*", { count: "exact", head: true }),
    supabase.from("packages").select("id, status, source_purchase_request_id"),
    supabase
      .from("package_declarations")
      .select("*", { count: "exact", head: true })
      .eq("status", "pending"),
    supabase.from("purchase_requests").select("status"),
    supabase
      .from("invoices")
      .select("*", { count: "exact", head: true })
      .eq("status", "customer_submitted"),
    supabase.from("invoices").select("package_id"),
    supabase
      .from("notifications")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(20),
  ])

  const packages = packageRows ?? []
  const purchaseRequests = purchaseRequestStatuses ?? []
  const newPurchaseRequestsCount = purchaseRequests.filter((r) => r.status === "submitted").length
  const quoteSentPurchaseRequestsCount = purchaseRequests.filter((r) => r.status === "quote_sent").length
  const awaitingPaymentPurchaseRequestsCount = purchaseRequests.filter((r) => r.status === "awaiting_payment").length
  const totalPackages = packages.length
  const needsActionCount = packages.filter((p) => p.status === "missing").length
  const quotedCount = packages.filter((p) => p.status === "quoted").length
  const paidCount = packages.filter((p) => p.status === "paid").length
  const shippedCount = packages.filter((p) => p.status === "shipped").length

  // Packages created from a purchased purchase-agency request (see
  // markPurchasedAndLinkPackage() in admin/purchase-requests/actions.ts)
  // keep going after the request itself reaches "purchased" -- they join
  // the normal packages pipeline (missing -> paid -> shipped, skipping
  // "quoted" since shipping was already collected). These three counts
  // extend the purchase-agency row past "purchased" so that downstream
  // progress is visible on this dashboard too, not just on /admin/packages.
  const purchaseAgencyPackages = packages.filter((p) => p.source_purchase_request_id)
  const paidAwaitingArrivalCount =
    purchaseRequests.filter((r) => r.status === "paid" || r.status === "purchasing").length +
    purchaseAgencyPackages.filter((p) => p.status === "missing").length
  const invoicedPackageIds = new Set((invoicedPackageRows ?? []).map((i) => i.package_id))
  const purchaseAgencyInvoiceNeededCount = purchaseAgencyPackages.filter(
    (p) => p.status === "paid" && !invoicedPackageIds.has(p.id)
  ).length
  const purchaseAgencyShippedCount = purchaseAgencyPackages.filter((p) => p.status === "shipped").length

  // Package + invoice lifecycle, in the order a package actually moves
  // through: a customer's pre-declaration comes in, an admin links/creates
  // the package, quotes it, collects payment, gets the commercial invoice
  // reviewed, then ships it.
  const shippingFlow: FlowStep[] = [
    {
      value: pendingDeclarationsCount ?? 0,
      label: t("statPendingDeclarations"),
      href: "/admin/packages",
      accent: true,
    },
    {
      value: needsActionCount,
      label: t("statNeedsAction"),
      href: "/admin/packages?status=missing",
      accent: true,
    },
    {
      value: quotedCount,
      label: t("statQuoted"),
      href: "/admin/packages?status=quoted",
      accent: true,
    },
    {
      value: paidCount,
      label: t("statPaid"),
      href: "/admin/packages?status=paid",
      accent: true,
    },
    {
      value: invoicesNeedReviewCount ?? 0,
      label: t("statInvoicesNeedReview"),
      href: "/admin/invoices",
      accent: true,
    },
    {
      value: shippedCount,
      label: t("statShipped"),
      href: "/admin/packages?status=shipped",
      accent: false,
    },
  ]

  // Purchase-agency request lifecycle, in order: a new request comes in, we
  // send a quote, the customer pays, we buy the item and wait for it to
  // reach our warehouse, then it needs a commercial invoice before it can
  // ship out to the customer like any other package.
  const purchaseFlow: FlowStep[] = [
    {
      value: newPurchaseRequestsCount,
      label: t("statNewPurchaseRequests"),
      href: "/admin/purchase-requests?status=submitted",
      accent: true,
    },
    {
      value: quoteSentPurchaseRequestsCount,
      label: t("statQuoteSentPurchaseRequests"),
      href: "/admin/purchase-requests?status=quote_sent",
      accent: true,
    },
    {
      value: awaitingPaymentPurchaseRequestsCount,
      label: t("statAwaitingPaymentPurchaseRequests"),
      href: "/admin/purchase-requests?status=awaiting_payment",
      accent: true,
    },
    {
      value: paidAwaitingArrivalCount,
      label: t("statPaidAwaitingArrival"),
      href: "/admin/purchase-requests?status=paid",
      accent: true,
    },
    {
      value: purchaseAgencyInvoiceNeededCount,
      label: t("statPurchaseAgencyInvoiceNeeded"),
      href: "/admin/invoices",
      accent: true,
    },
    {
      value: purchaseAgencyShippedCount,
      label: t("statPurchaseAgencyShipped"),
      href: "/admin/packages?status=shipped",
      accent: false,
    },
  ]

  const overviewCards: FlowStep[] = [
    {
      value: totalPackages,
      label: t("statTotalPackages"),
      href: "/admin/packages",
      accent: false,
    },
    {
      value: userCount ?? 0,
      label: t("statUsers"),
      href: "/admin/users",
      accent: false,
    },
  ]

  const quickLinks = [
    { href: "/admin/packages", label: t("packagesCard") },
    { href: "/admin/users", label: t("usersCard") },
    { href: "/admin/purchase-requests", label: t("purchaseRequestsCard") },
    { href: "/admin/invoices", label: t("invoicesCard") },
    { href: "/admin/pricing", label: t("pricingCard") },
    { href: "/admin/shipping", label: t("shippingCard") },
    { href: "/admin/settings", label: t("settingsCard") },
  ]

  return (
    <main className="min-h-screen bg-[var(--usj-surface)]">
      <div className="mx-auto max-w-4xl px-6 py-10">
        <h1 className="text-xl font-bold text-primary">{t("title")}</h1>
        <p className="mt-1 text-sm text-muted-foreground">{t("description")}</p>

        <div className="mt-6">
          <NotificationPanel notifications={notifications ?? []} />
        </div>

        <div className="mt-6 space-y-6">
          <WorkflowRow heading={t("statShippingFlowHeading")} steps={shippingFlow} />
          <WorkflowRow heading={t("statPurchaseFlowHeading")} steps={purchaseFlow} />
        </div>

        <div className="mt-6">
          <h2 className="text-sm font-semibold text-muted-foreground">
            {t("statOverviewHeading")}
          </h2>
          <div className="mt-2 grid grid-cols-2 gap-3 sm:max-w-xs">
            {overviewCards.map((card) => (
              <Link key={card.label} href={card.href}>
                <Card className="h-full transition-colors hover:border-primary/40">
                  <CardContent className="py-4 text-center">
                    <p className="text-2xl font-bold text-foreground">{card.value}</p>
                    <p className="mt-1 text-xs text-muted-foreground">{card.label}</p>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </div>

        <div className="mt-10">
          <h2 className="text-sm font-semibold text-muted-foreground">
            {t("quickLinksHeading")}
          </h2>
          <div className="mt-3 flex flex-wrap gap-2">
            {quickLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="rounded-full border border-input bg-white px-3.5 py-1.5 text-sm text-foreground transition-colors hover:border-primary/40 hover:bg-primary/5"
              >
                {link.label}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </main>
  )
}

function WorkflowRow({ heading, steps }: { heading: string; steps: FlowStep[] }) {
  return (
    <div>
      <h2 className="text-sm font-semibold text-muted-foreground">{heading}</h2>
      <div className="mt-2 flex items-center overflow-x-auto pb-2">
        {steps.map((step, index) => (
          <div key={step.label} className="flex flex-shrink-0 items-center">
            <Link href={step.href} className="block flex-shrink-0">
              <Card className="h-full w-[128px] transition-colors hover:border-primary/40">
                <CardContent className="py-4 text-center">
                  <p
                    className={`text-2xl font-bold ${step.accent ? "text-accent" : "text-foreground"}`}
                  >
                    {step.value}
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">{step.label}</p>
                </CardContent>
              </Card>
            </Link>
            {index < steps.length - 1 && (
              <ChevronRight className="mx-1 h-5 w-5 flex-shrink-0 text-muted-foreground/40" />
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
