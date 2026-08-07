import { redirect, Link } from "@/i18n/navigation"
import { notFound } from "next/navigation"
import { getLocale, getTranslations } from "next-intl/server"
import { createClient } from "@/lib/supabase/server"
import PayButton from "./pay-button"
import CancelButton from "./cancel-button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft } from "lucide-react"
import { formatUSD } from "@/lib/format"

const STATUS_BADGE_CLASS: Record<string, string> = {
  submitted: "bg-slate-100 text-slate-700",
  quote_sent: "bg-amber-100 text-amber-800",
  awaiting_payment: "bg-amber-100 text-amber-800",
  paid: "bg-teal-100 text-teal-800",
  purchasing: "bg-teal-100 text-teal-800",
  purchased: "bg-teal-100 text-teal-800",
  cancelled: "bg-destructive/10 text-destructive",
  refunded: "bg-slate-100 text-slate-500",
}

export default async function PurchaseRequestDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const locale = await getLocale()
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect({ href: "/login", locale })
    return
  }

  const t = await getTranslations("purchaseRequests")

  const { data: request } = await supabase
    .from("purchase_requests")
    .select("*")
    .eq("id", id)
    .eq("user_id", user.id)
    .single()

  if (!request) {
    notFound()
  }

  const canPay = request.status === "quote_sent" && request.quote_total_cents
  const canCancel = ["submitted", "quote_sent", "awaiting_payment"].includes(
    request.status,
  )
  const nowIso = new Date().toISOString()
  const isExpired = Boolean(
    request.quote_expires_at && request.quote_expires_at < nowIso,
  )

  return (
    <main className="min-h-screen bg-[var(--usj-surface)]">
      <div className="mx-auto max-w-2xl px-6 py-10">
        <Link
          href="/dashboard/purchase-requests"
          className="flex items-center gap-1.5 text-sm font-medium text-primary hover:underline"
        >
          <ArrowLeft className="h-4 w-4" />
          {t("backToList")}
        </Link>

        <div className="mt-4 space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-start justify-between gap-3">
              <CardTitle className="text-lg font-semibold text-slate-900">
                {request.product_description}
              </CardTitle>
              <Badge
                variant="outline"
                className={`shrink-0 border-transparent ${STATUS_BADGE_CLASS[request.status] ?? "bg-slate-100 text-slate-700"}`}
              >
                {t(`status.${request.status}`)}
              </Badge>
            </CardHeader>

            <CardContent className="space-y-3">
              {request.product_url && (
                <a
                  href={request.product_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block break-all text-sm text-primary hover:underline"
                >
                  {request.product_url}
                </a>
              )}

              {request.budget_cap_cents != null && (
                <p className="text-sm text-slate-600">
                  {t("budgetCapLabel")}: $
                  {formatUSD(request.budget_cap_cents / 100)}
                </p>
              )}
            </CardContent>

            {(canPay || canCancel) && (
              <CardFooter className="flex flex-wrap gap-3">
                {canPay && !isExpired && <PayButton requestId={request.id} />}
                {canPay && isExpired && (
                  <p className="text-sm text-destructive">{t("quoteExpired")}</p>
                )}
                {canCancel && <CancelButton requestId={request.id} />}
              </CardFooter>
            )}
          </Card>

          {request.quote_total_cents != null && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">{t("quoteBreakdownTitle")}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-1 text-sm text-slate-700">
                <div className="flex justify-between">
                  <span>{t("quoteItemPrice")}</span>
                  <span>
                    ${formatUSD((request.quote_item_price_cents ?? 0) / 100)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>{t("quoteFee")}</span>
                  <span>${formatUSD((request.quote_fee_cents ?? 0) / 100)}</span>
                </div>
                <div className="flex justify-between border-t border-slate-200 pt-1 font-semibold text-slate-900">
                  <span>{t("quoteTotal")}</span>
                  <span>${formatUSD(request.quote_total_cents / 100)}</span>
                </div>
                {request.quote_note && (
                  <p className="pt-2 text-sm text-muted-foreground">
                    {request.quote_note}
                  </p>
                )}
                {request.quote_expires_at && (
                  <p className="pt-1 text-xs text-muted-foreground">
                    {t("quoteExpiresAt", {
                      date: new Date(request.quote_expires_at).toLocaleDateString(
                        locale,
                      ),
                    })}
                  </p>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </main>
  )
}
