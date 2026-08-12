import { redirect, Link } from "@/i18n/navigation"
import { createClient } from "@/lib/supabase/server"
import { getLocale, getTranslations } from "next-intl/server"
import RequestRow from "./request-row"
import FeeSettingsForm from "./fee-settings-form"
import WhitelistForm from "./whitelist-form"
import SquareModeToggle from "./square-mode-toggle"
import { getPurchaseAgencyFeeSettings } from "@/lib/purchase-agency-settings"
import { getWhitelistDomains } from "@/lib/purchase-agency-whitelist"
import { getSquareMode } from "@/lib/square"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"

export default async function AdminPurchaseRequestsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>
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
    return
  }

  const t = await getTranslations("adminPurchaseRequests")

  const { status = "" } = await searchParams

  const { data: allRequests } = await supabase
    .from("purchase_requests")
    .select("*, profiles(full_name, suite_number)")
    .order("created_at", { ascending: false })

  const requests = allRequests ?? []
  const statCounts = {
    total: requests.length,
    submitted: requests.filter((r) => r.status === "submitted").length,
    quote_sent: requests.filter((r) => r.status === "quote_sent").length,
    awaiting_payment: requests.filter((r) => r.status === "awaiting_payment").length,
    paid: requests.filter((r) => r.status === "paid").length,
    purchasing: requests.filter((r) => r.status === "purchasing").length,
    purchased: requests.filter((r) => r.status === "purchased").length,
    cancelled: requests.filter((r) => r.status === "cancelled").length,
    refunded: requests.filter((r) => r.status === "refunded").length,
  }
  const feeSettings = await getPurchaseAgencyFeeSettings()
  const whitelistDomains = await getWhitelistDomains()
  const squareMode = await getSquareMode()
  const filtered = status
    ? requests.filter((r) => r.status === status)
    : requests

  const STATUS_FILTERS = [
    { value: "", label: t("filterAll") },
    { value: "submitted", label: t("filterSubmitted") },
    { value: "quote_sent", label: t("filterQuoteSent") },
    { value: "awaiting_payment", label: t("filterAwaitingPayment") },
    { value: "paid", label: t("filterPaid") },
    { value: "purchasing", label: t("filterPurchasing") },
    { value: "purchased", label: t("filterPurchased") },
    { value: "cancelled", label: t("filterCancelled") },
    { value: "refunded", label: t("filterRefunded") },
  ]

  const STAT_CARDS = [
    { value: statCounts.total, label: t("statTotal"), href: "/admin/purchase-requests" },
    { value: statCounts.submitted, label: t("status.submitted"), href: "/admin/purchase-requests?status=submitted" },
    { value: statCounts.quote_sent, label: t("status.quote_sent"), href: "/admin/purchase-requests?status=quote_sent" },
    { value: statCounts.awaiting_payment, label: t("status.awaiting_payment"), href: "/admin/purchase-requests?status=awaiting_payment" },
    { value: statCounts.paid, label: t("status.paid"), href: "/admin/purchase-requests?status=paid" },
    { value: statCounts.purchasing, label: t("status.purchasing"), href: "/admin/purchase-requests?status=purchasing" },
    { value: statCounts.purchased, label: t("status.purchased"), href: "/admin/purchase-requests?status=purchased" },
    { value: statCounts.cancelled, label: t("status.cancelled"), href: "/admin/purchase-requests?status=cancelled" },
    { value: statCounts.refunded, label: t("status.refunded"), href: "/admin/purchase-requests?status=refunded" },
  ]

  return (
    <main className="min-h-screen bg-[var(--usj-surface)]">
      <div className="mx-auto max-w-4xl px-6 py-10">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold text-primary">{t("title")}</h1>
            <p className="mt-1 text-sm text-muted-foreground">{t("description")}</p>
          </div>
          <Button asChild variant="ghost" size="sm">
            <Link href="/admin/packages">{t("packagesLink")}</Link>
          </Button>
        </div>

        <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
          {STAT_CARDS.map((card) => (
            <Link key={card.label} href={card.href}>
              <Card className="h-full transition-colors hover:border-primary/40">
                <CardContent className="py-3 text-center">
                  <p className="text-xl font-bold text-foreground">{card.value}</p>
                  <p className="mt-1 text-xs text-muted-foreground">{card.label}</p>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>

        <FeeSettingsForm
          initialSettings={{
            flatFeeCents: feeSettings.flatFeeCents,
            feePercent: Math.round(feeSettings.feePercent * 10000) / 100,
          }}
        />

        <WhitelistForm initialDomains={whitelistDomains} />

        <SquareModeToggle initialMode={squareMode} />

        <form className="mt-6 flex flex-wrap items-center gap-2" method="get">
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
            {t("filterButton")}
          </Button>
        </form>

        <div className="mt-6 space-y-3">
          {filtered.map((request) => (
            <RequestRow key={request.id} request={request} feeSettings={feeSettings} />
          ))}

          {filtered.length === 0 && (
            <div className="rounded-xl border border-dashed border-border bg-card p-8 text-center text-sm text-muted-foreground">
              {requests.length === 0 ? t("emptyNone") : t("emptyFiltered")}
            </div>
          )}
        </div>
      </div>
    </main>
  )
}
