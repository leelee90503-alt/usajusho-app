import { redirect, Link } from '@/i18n/navigation'
import { createClient } from "@/lib/supabase/server"
import { getLocale, getTranslations } from 'next-intl/server'
import NotificationPanel from "./notification-panel"
import { Card, CardContent } from "@/components/ui/card"

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
    { data: packageStatuses },
    { count: pendingDeclarationsCount },
    { data: purchaseRequestStatuses },
    { count: invoicesNeedReviewCount },
    { data: notifications },
  ] = await Promise.all([
    supabase.from("profiles").select("*", { count: "exact", head: true }),
    supabase.from("packages").select("status"),
    supabase
      .from("package_declarations")
      .select("*", { count: "exact", head: true })
      .eq("status", "pending"),
    supabase.from("purchase_requests").select("status"),
    supabase
      .from("invoices")
      .select("*", { count: "exact", head: true })
      .eq("status", "customer_submitted"),
    supabase
      .from("notifications")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(20),
  ])

  const packages = packageStatuses ?? []
  const purchaseRequests = purchaseRequestStatuses ?? []
  const newPurchaseRequestsCount = purchaseRequests.filter((r) => r.status === "submitted").length
  const quoteSentPurchaseRequestsCount = purchaseRequests.filter((r) => r.status === "quote_sent").length
  const awaitingPaymentPurchaseRequestsCount = purchaseRequests.filter((r) => r.status === "awaiting_payment").length
  const totalPackages = packages.length
  const needsActionCount = packages.filter((p) => p.status === "missing").length
  const quotedCount = packages.filter((p) => p.status === "quoted").length
  const paidCount = packages.filter((p) => p.status === "paid").length
  const shippedCount = packages.filter((p) => p.status === "shipped").length

  const statCards = [
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
      value: shippedCount,
      label: t("statShipped"),
      href: "/admin/packages?status=shipped",
      accent: false,
    },
    {
      value: pendingDeclarationsCount ?? 0,
      label: t("statPendingDeclarations"),
      href: "/admin/packages",
      accent: true,
    },
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
      value: invoicesNeedReviewCount ?? 0,
      label: t("statInvoicesNeedReview"),
      href: "/admin/invoices",
      accent: true,
    },
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

        <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3">
          {statCards.map((card) => (
            <Link key={card.label} href={card.href}>
              <Card className="h-full transition-colors hover:border-primary/40">
                <CardContent className="py-4 text-center">
                  <p
                    className={`text-2xl font-bold ${card.accent ? "text-accent" : "text-foreground"}`}
                  >
                    {card.value}
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">{card.label}</p>
                </CardContent>
              </Card>
            </Link>
          ))}
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
