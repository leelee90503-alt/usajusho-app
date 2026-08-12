'use client'

import { useRouter } from "next/navigation"
import { useTranslations } from "next-intl"
import { payShipmentWithCard, payAdditionalChargeWithCard } from "./actions"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Package as PackageIcon } from "lucide-react"
import { formatUSD } from "@/lib/format"
import SquareCardPayment from "@/components/square-card-payment"
import { buildBillingContact } from "@/lib/square"
import OrderStepper from "./order-stepper"
import { computeShippingSteps, computePurchaseSteps } from "./order-progress"

type SquareConfig = { mode: "sandbox" | "production"; applicationId: string; locationId: string }

type Package = {
  id: string
  item_name: string
  tracking_number: string | null
  weight_lbs: number | null
  admin_note: string | null
  status: string
  quote_amount: number | null
  quote_note: string | null
  source_purchase_request_id: string | null
}

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

const STATUS_BADGE_VARIANT: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  quoted: "default",
  paid: "secondary",
  shipped: "secondary",
}

export default function PackageList({
  packages,
  profile = null,
  emptyVariant = "default",
  additionalCharges = {},
  photosByPackageId = {},
  invoiceStatusByPackageId = {},
  squareConfig = null,
}: {
  packages: Package[]
  profile?: Profile | null
  emptyVariant?: "default" | "completed"
  additionalCharges?: Record<string, AdditionalCharge[]>
  photosByPackageId?: Record<string, PackagePhoto[]>
  invoiceStatusByPackageId?: Record<string, string>
  squareConfig?: SquareConfig | null
}) {
  const t = useTranslations("packageList")
  const japanAddress = formatJapanAddress(profile)
  const router = useRouter()
  const STATUS_LABELS: Record<string, string> = {
    quoted: t("statusQuoted"),
    paid: t("statusPaid"),
    shipped: t("statusShipped"),
  }
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

  if (!packages || packages.length === 0) {
    return (
      <Card className="mt-3 border-dashed">
        <CardContent className="py-8 text-center text-sm text-muted-foreground">
          {emptyVariant === "completed" ? t("emptyCompleted") : t("empty")}
          <br />
          {emptyVariant === "completed" ? t("emptyCompletedHint") : t("emptyHint")}
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="mt-3 space-y-3">
      <div className="space-y-3">
        {packages.map((pkg) => (
          <Card key={pkg.id}>
            <CardContent className="py-4">
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-3">
                  <PackageIcon className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                  <div>
                    <p className="font-semibold text-slate-900">{pkg.item_name}</p>
                    {pkg.tracking_number && (
                      <p className="mt-1 text-xs text-muted-foreground">
                        {t("trackingNumber")}{pkg.tracking_number}
                      </p>
                    )}
                    {pkg.weight_lbs && (
                      <p className="mt-1 text-xs text-muted-foreground">
                        {t("weight")}{pkg.weight_lbs} {t("weightUnit")}
                      </p>
                    )}
                    {pkg.admin_note && (
                      <p className="mt-2 text-xs text-slate-600">{pkg.admin_note}</p>
                    )}
                  </div>
                </div>
                <Badge variant={STATUS_BADGE_VARIANT[pkg.status] ?? "outline"} className="whitespace-nowrap">
                  {STATUS_LABELS[pkg.status] || pkg.status}
                </Badge>
              </div>

              {pkg.status === "quoted" && pkg.quote_amount && (
                <div className="mt-3 rounded-lg bg-slate-50 p-3">
                  <p className="text-sm text-slate-700">
                    {t("quoteLabel")}${formatUSD(pkg.quote_amount)}
                  </p>
                  {pkg.quote_note && (
                    <p className="mt-1 text-xs text-muted-foreground">{pkg.quote_note}</p>
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
                        action={(sourceId) => payShipmentWithCard(pkg.id, sourceId)}
                        triggerLabel={t("pay")}
                        dialogTitle={t("cardPayDialogTitle")}
                        amountLabel={`$${formatUSD(pkg.quote_amount)}`}
                        amount={Number(pkg.quote_amount).toFixed(2)}
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

              {(additionalCharges[pkg.id] ?? []).length > 0 && (
                <div className="mt-3 space-y-2 border-t border-slate-200 pt-3">
                  <p className="text-xs font-semibold text-slate-700">{t("additionalChargesHeading")}</p>
                  {(additionalCharges[pkg.id] ?? []).map((charge) => (
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

              {(photosByPackageId[pkg.id] ?? []).length > 0 && (
                <div className="mt-3 border-t border-slate-200 pt-3">
                  <p className="text-xs font-semibold text-slate-700">{t("photosHeading")}</p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {(photosByPackageId[pkg.id] ?? []).map((photo) => (
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
                  pkg.source_purchase_request_id
                    ? computePurchaseSteps(purchaseStepLabels, {
                        linkedPackageStatus: pkg.status,
                        hasInvoice: invoiceStatusByPackageId[pkg.id] != null,
                        invoiceStatus: invoiceStatusByPackageId[pkg.id] ?? null,
                      })
                    : computeShippingSteps(shippingStepLabels, {
                        hasPackage: true,
                        packageStatus: pkg.status,
                        hasInvoice: invoiceStatusByPackageId[pkg.id] != null,
                        invoiceStatus: invoiceStatusByPackageId[pkg.id] ?? null,
                      })
                }
                actionLabel={t("stepActionNeeded")}
              />
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
