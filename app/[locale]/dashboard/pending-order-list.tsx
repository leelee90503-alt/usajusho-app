'use client'

import { useRouter } from "next/navigation"
import { useTranslations } from "next-intl"
import { Link } from "@/i18n/navigation"
import { payShipmentWithCard, payAdditionalChargeWithCard } from "./actions"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Package as PackageIcon, PackagePlus, ShoppingCart } from "lucide-react"
import { formatUSD } from "@/lib/format"
import SquareCardPayment from "@/components/square-card-payment"
import { buildBillingContact } from "@/lib/square"
import OrderStepper from "./order-stepper"
import { computeShippingSteps, computePurchaseSteps } from "./order-progress"

type SquareConfig = { mode: "sandbox" | "production"; applicationId: string; locationId: string }

type PackageOrder = {
  kind: "package"
  id: string
  created_at: string
  item_name: string
  tracking_number: string | null
  weight_lbs: number | null
  admin_note: string | null
  status: string
  quote_amount: number | null
  quote_note: string | null
  source_purchase_request_id: string | null
}

type DeclarationOrder = {
  kind: "declaration"
  id: string
  created_at: string
  item_name: string
  origin_tracking_number: string | null
  status: string
}

type PurchaseRequestOrder = {
  kind: "purchaseRequest"
  id: string
  created_at: string
  product_description: string
  status: string
  quote_total_cents: number | null
}

type PendingOrder = PackageOrder | DeclarationOrder | PurchaseRequestOrder

type AdditionalCharge = {
  id: string
  reason: string
  amount_cents: number
  status: string
}

type PackagePhoto = {
  id: string
  url: string
}

type Profile = {
  full_name: string | null
  first_name: string | null
  last_name: string | null
  email: string | null
  phone_number: string | null
  japan_postal_code: string | null
  japan_prefecture: string | null
  japan_city: string | null
  japan_address_line1: string | null
  japan_address_line2: string | null
}

function formatJapanAddress(profile: Profile | null) {
  if (!profile) return null
  const parts = [
    profile.japan_postal_code ? `〒${profile.japan_postal_code}` : null,
    profile.japan_prefecture,
    profile.japan_city,
    profile.japan_address_line1,
    profile.japan_address_line2,
  ].filter(Boolean)
  return parts.length > 0 ? parts.join(" ") : null
}

const PACKAGE_STATUS_VARIANT: Record<string, "default" | "secondary" | "outline"> = {
  quoted: "default",
  paid: "secondary",
}

const DECLARATION_STATUS_VARIANT: Record<string, "default" | "secondary" | "outline"> = {
  pending: "outline",
}

const REQUEST_STATUS_CLASS: Record<string, string> = {
  submitted: "bg-slate-100 text-slate-700",
  quote_sent: "bg-amber-100 text-amber-800",
  awaiting_payment: "bg-amber-100 text-amber-800",
  paid: "bg-teal-100 text-teal-800",
  purchasing: "bg-teal-100 text-teal-800",
}

export default function PendingOrderList({
  packages,
  declarations,
  purchaseRequests,
  profile = null,
  additionalCharges = {},
  photosByPackageId = {},
  invoiceStatusByPackageId = {},
  squareConfig = null,
}: {
  packages: PackageOrder[]
  declarations: DeclarationOrder[]
  purchaseRequests: PurchaseRequestOrder[]
  profile?: Profile | null
  additionalCharges?: Record<string, AdditionalCharge[]>
  photosByPackageId?: Record<string, PackagePhoto[]>
  invoiceStatusByPackageId?: Record<string, string>
  squareConfig?: SquareConfig | null
}) {
  const t = useTranslations("packageList")
  const tDeclarations = useTranslations("packageDeclarations")
  const tRequests = useTranslations("purchaseRequests")
  const japanAddress = formatJapanAddress(profile)
  const router = useRouter()

  const CHARGE_STATUS_LABELS: Record<string, string> = {
    pending: t("chargeStatusPending"),
    awaiting_payment: t("chargeStatusAwaitingPayment"),
    paid: t("chargeStatusPaid"),
    cancelled: t("chargeStatusCancelled"),
    refunded: t("chargeStatusRefunded"),
  }

  const shippingStepLabels: [string, string, string, string, string, string] = [
    t("stepDeclarationReceived"),
    t("stepArrivalCheck"),
    t("stepQuoteReady"),
    t("stepPaymentComplete"),
    t("stepCustomsInvoice"),
    t("stepShipped"),
  ]
  const purchaseStepLabels: [string, string, string, string, string, string] = [
    t("stepRequestReceived"),
    t("stepQuoteSent"),
    t("stepAwaitingPayment"),
    t("stepPaidAwaitingArrival"),
    t("stepCustomsInvoice"),
    t("stepShipped"),
  ]

  const orders: PendingOrder[] = [...packages, ...declarations, ...purchaseRequests].sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  )

  if (orders.length === 0) {
    return (
      <Card className="mt-3 border-dashed">
        <CardContent className="py-8 text-center text-sm text-muted-foreground">
          {t("empty")}
          <br />
          {t("emptyHint")}
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="mt-3 space-y-3">
      {orders.map((order) => {
        if (order.kind === "package") {
          return (
            <Card key={`package-${order.id}`}>
              <CardContent className="py-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3">
                    <PackageIcon className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                    <div>
                      <p className="text-[11px] font-medium tracking-wide text-muted-foreground uppercase">
                        {t("typePackage")}
                      </p>
                      <p className="font-semibold text-slate-900">{order.item_name}</p>
                      {order.tracking_number && (
                        <p className="mt-1 text-xs text-muted-foreground">
                          {t("trackingNumber")}{order.tracking_number}
                        </p>
                      )}
                      {order.weight_lbs && (
                        <p className="mt-1 text-xs text-muted-foreground">
                          {t("weight")}{order.weight_lbs} {t("weightUnit")}
                        </p>
                      )}
                      {order.admin_note && (
                        <p className="mt-2 text-xs text-slate-600">{order.admin_note}</p>
                      )}
                    </div>
                  </div>
                  <Badge variant={PACKAGE_STATUS_VARIANT[order.status] ?? "outline"} className="whitespace-nowrap">
                    {order.status === "quoted"
                      ? t("statusQuoted")
                      : order.status === "paid"
                        ? t("statusPaid")
                        : order.status}
                  </Badge>
                </div>

                {order.status === "quoted" && order.quote_amount && (
                  <div className="mt-3 rounded-lg bg-slate-50 p-3">
                    <p className="text-sm text-slate-700">
                      {t("quoteLabel")}${formatUSD(order.quote_amount)}
                    </p>
                    {order.quote_note && (
                      <p className="mt-1 text-xs text-muted-foreground">{order.quote_note}</p>
                    )}
                    <div className="mt-2 space-y-0.5 border-t border-slate-200 pt-2 text-xs text-slate-600">
                      <p className="font-semibold text-slate-700">{t("quoteRecipientHeading")}</p>
                      <p>{t("quoteRecipientName")}{profile?.full_name || "—"}</p>
                      <p>{t("quoteRecipientPhone")}{profile?.phone_number || t("quoteRecipientNotSet")}</p>
                      <p>{t("quoteRecipientAddress")}{japanAddress || t("quoteRecipientNotSet")}</p>
                    </div>
                    {squareConfig && (
                      <div className="mt-2">
                        <SquareCardPayment
                          mode={squareConfig.mode}
                          applicationId={squareConfig.applicationId}
                          locationId={squareConfig.locationId}
                          action={(sourceId) => payShipmentWithCard(order.id, sourceId)}
                          triggerLabel={t("pay")}
                          dialogTitle={t("cardPayDialogTitle")}
                          amountLabel={`$${formatUSD(order.quote_amount)}`}
                          amount={Number(order.quote_amount).toFixed(2)}
                          billingContact={buildBillingContact(profile)}
                          submitLabel={t("cardPaySubmit")}
                          submittingLabel={t("cardPaySubmitting")}
                          genericErrorLabel={t("cardPayError")}
                          successLabel={t("cardPaySuccess")}
                          onSuccess={() => router.refresh()}
                        />
                      </div>
                    )}
                  </div>
                )}

                {(additionalCharges[order.id] ?? []).length > 0 && (
                  <div className="mt-3 space-y-2 border-t border-slate-200 pt-3">
                    <p className="text-xs font-semibold text-slate-700">{t("additionalChargesHeading")}</p>
                    {(additionalCharges[order.id] ?? []).map((charge) => (
                      <div key={charge.id} className="rounded-lg bg-slate-50 p-3">
                        <div className="flex items-center justify-between gap-2">
                          <p className="text-sm text-slate-700">
                            {charge.reason} — ${formatUSD(charge.amount_cents / 100)}
                          </p>
                          <Badge variant="outline" className="whitespace-nowrap text-xs">
                            {CHARGE_STATUS_LABELS[charge.status] || charge.status}
                          </Badge>
                        </div>
                        {charge.status === "pending" && squareConfig && (
                          <div className="mt-2">
                            <SquareCardPayment
                              mode={squareConfig.mode}
                              applicationId={squareConfig.applicationId}
                              locationId={squareConfig.locationId}
                              action={(sourceId) => payAdditionalChargeWithCard(charge.id, sourceId)}
                              triggerLabel={t("pay")}
                              dialogTitle={t("cardPayDialogTitle")}
                              amountLabel={`$${formatUSD(charge.amount_cents / 100)}`}
                              amount={(charge.amount_cents / 100).toFixed(2)}
                              billingContact={buildBillingContact(profile)}
                              submitLabel={t("cardPaySubmit")}
                              submittingLabel={t("cardPaySubmitting")}
                              genericErrorLabel={t("cardPayError")}
                              successLabel={t("cardPaySuccess")}
                              onSuccess={() => router.refresh()}
                            />
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                {(photosByPackageId[order.id] ?? []).length > 0 && (
                  <div className="mt-3 border-t border-slate-200 pt-3">
                    <p className="text-xs font-semibold text-slate-700">{t("photosHeading")}</p>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {(photosByPackageId[order.id] ?? []).map((photo) => (
                        <a key={photo.id} href={photo.url} target="_blank" rel="noopener noreferrer">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={photo.url}
                            alt=""
                            className="h-16 w-16 rounded-md border border-slate-200 object-cover"
                          />
                        </a>
                      ))}
                    </div>
                  </div>
                )}

                <OrderStepper
                  steps={
                    order.source_purchase_request_id
                      ? computePurchaseSteps(purchaseStepLabels, {
                          linkedPackageStatus: order.status,
                          hasInvoice: invoiceStatusByPackageId[order.id] != null,
                          invoiceStatus: invoiceStatusByPackageId[order.id] ?? null,
                        })
                      : computeShippingSteps(shippingStepLabels, {
                          hasPackage: true,
                          packageStatus: order.status,
                          hasInvoice: invoiceStatusByPackageId[order.id] != null,
                          invoiceStatus: invoiceStatusByPackageId[order.id] ?? null,
                        })
                  }
                  actionLabel={t("stepActionNeeded")}
                />
              </CardContent>
            </Card>
          )
        }

        if (order.kind === "declaration") {
          return (
            <Link key={`declaration-${order.id}`} href="/dashboard/declarations">
              <Card className="transition-shadow hover:shadow-md">
                <CardContent className="py-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-3">
                      <PackagePlus className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                      <div>
                        <p className="text-[11px] font-medium tracking-wide text-muted-foreground uppercase">
                          {t("typeDeclaration")}
                        </p>
                        <p className="font-semibold text-slate-900">{order.item_name}</p>
                        {order.origin_tracking_number && (
                          <p className="mt-1 text-xs text-muted-foreground">
                            {tDeclarations("trackingLabel")}: {order.origin_tracking_number}
                          </p>
                        )}
                      </div>
                    </div>
                    <Badge variant={DECLARATION_STATUS_VARIANT[order.status] ?? "outline"} className="whitespace-nowrap">
                      {tDeclarations(`status.${order.status}`)}
                    </Badge>
                </div>

                <OrderStepper
                  steps={computeShippingSteps(shippingStepLabels, { hasPackage: false })}
                />
              </CardContent>
            </Card>
           </Link>
          )
        }

        return (
          <Link key={`request-${order.id}`} href={`/dashboard/purchase-requests/${order.id}`}>
            <Card className="transition-shadow hover:shadow-md">
              <CardContent className="py-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <ShoppingCart className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                    <div>
                      <p className="text-[11px] font-medium tracking-wide text-muted-foreground uppercase">
                        {t("typePurchaseRequest")}
                      </p>
                      <p className="line-clamp-1 font-semibold text-slate-900">
                        {order.product_description}
                      </p>
                    </div>
                  </div>
                  <Badge
                    variant="outline"
                    className={`shrink-0 border-transparent ${REQUEST_STATUS_CLASS[order.status] ?? "bg-slate-100 text-slate-700"}`}
                  >
                    {tRequests(`status.${order.status}`)}
                  </Badge>
                </div>
                {order.quote_total_cents != null && (
                  <p className="mt-2 text-sm text-slate-600">
                    {tRequests("quoteLabel")}: ${formatUSD(order.quote_total_cents / 100)}
                  </p>
                )}

                <OrderStepper
                  steps={computePurchaseSteps(purchaseStepLabels, { requestStatus: order.status })}
                  actionLabel={t("stepActionNeeded")}
                />
              </CardContent>
            </Card>
          </Link>
        )
      })}
    </div>
  )
}
