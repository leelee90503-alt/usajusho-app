'use client'

import { useState, useTransition } from "react"
import { useTranslations } from "next-intl"
import { Link } from "@/i18n/navigation"
import { updatePackageStatus, deletePackage, markShipped, createAdditionalCharge } from "./actions"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent } from "@/components/ui/card"
import CarrierTrackLink from "@/components/carrier-track-link"
import { Trash2 } from "lucide-react"
import { formatUSD } from "@/lib/format"

type PackageWithProfile = {
  id: string
  item_name: string
  tracking_number: string | null
  admin_note: string | null
  status: string
  weight_kg: number | null
  length_cm: number | null
  width_cm: number | null
  height_cm: number | null
  chargeable_weight_kg: number | null
  quote_amount: number | null
  quote_note: string | null
  shipping_prepaid?: boolean
  profiles?: {
    full_name: string | null
    suite_number: string | null
    phone_number: string | null
    japan_postal_code: string | null
    japan_prefecture: string | null
    japan_city: string | null
    japan_address_line1: string | null
    japan_address_line2: string | null
  } | null
}

function formatJapanAddress(profile: PackageWithProfile["profiles"]) {
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

type LinkedDeclaration = {
  order_amount: number | null
  origin_tracking_number: string | null
}

type PackageInvoice = {
  status: string
}

type AdditionalCharge = {
  id: string
  reason: string
  amount_cents: number
  status: string
}

const CHARGE_STATUS_BADGE_CLASS: Record<string, string> = {
  pending: "bg-slate-100 text-slate-700",
  awaiting_payment: "bg-amber-100 text-amber-800",
  paid: "bg-teal-100 text-teal-800",
  cancelled: "bg-slate-100 text-slate-500",
  refunded: "bg-slate-100 text-slate-500",
}

const STATUS_BADGE_VARIANT: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  missing: "destructive",
  quoted: "default",
  paid: "secondary",
  shipped: "secondary",
}

const INVOICE_STATUS_LABEL_KEY: Record<string, string> = {
  draft: "statusDraft",
  customer_submitted: "statusSubmitted",
  correction_required: "statusCorrectionRequired",
  admin_review: "statusAdminReview",
  complete: "statusComplete",
}

export default function PackageRow({
  pkg,
  invoice,
  declaration,
  additionalCharges = [],
}: {
  pkg: PackageWithProfile
  invoice: PackageInvoice | null
  declaration: LinkedDeclaration | null
  additionalCharges?: AdditionalCharge[]
}) {
  const t = useTranslations("packageRow")
  const tStatus = useTranslations("packageStatus")
  const tAdmin = useTranslations("adminPackages")
  const tInvoices = useTranslations("adminInvoices")
  const STATUS_OPTIONS = [
    { value: "missing", label: tStatus("missing") },
    { value: "quoted", label: tStatus("quoted") },
    { value: "paid", label: tStatus("paid") },
    { value: "shipped", label: tStatus("shipped") },
  ]
  const [isPending, startTransition] = useTransition()
  const [statusMessage, setStatusMessage] = useState<string | null>(null)
  const [trackingInput, setTrackingInput] = useState(() => pkg.tracking_number ?? "")
  const [shipMessage, setShipMessage] = useState<string | null>(null)
  const japanAddress = formatJapanAddress(pkg.profiles)
  const [chargeReason, setChargeReason] = useState("")
  const [chargeAmount, setChargeAmount] = useState("")
  const [chargeMessage, setChargeMessage] = useState<string | null>(null)
  const [showChargeForm, setShowChargeForm] = useState(false)

  function handleCreateCharge() {
    const amountCents = Math.round(Number(chargeAmount) * 100)
    if (!chargeReason.trim() || !amountCents || amountCents <= 0) {
      setChargeMessage(tAdmin("additionalChargeInvalid"))
      return
    }
    setChargeMessage(null)
    startTransition(async () => {
      const result = await createAdditionalCharge(pkg.id, chargeReason, amountCents)
      if (result?.error) {
        setChargeMessage(result.error)
      } else {
        setChargeMessage(tAdmin("additionalChargeSuccess"))
        setChargeReason("")
        setChargeAmount("")
        setShowChargeForm(false)
      }
    })
  }

  function handleStatusChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const status = e.target.value
    setStatusMessage(null)
    startTransition(async () => {
      const result = await updatePackageStatus(pkg.id, status)
      if (result?.error) {
        setStatusMessage(result.error)
      }
    })
  }

  function handleDelete() {
    const ok = confirm(t("deleteConfirm", { name: pkg.item_name }))
    if (!ok) return
    startTransition(() => {
      deletePackage(pkg.id)
    })
  }

  function handleMarkShipped() {
    const trimmed = trackingInput.trim()
    if (!trimmed) {
      setShipMessage(t("markShippedMissingTracking"))
      return
    }
    if (invoice?.status !== "complete") {
      const proceed = window.confirm(t("markShippedInvoiceWarning"))
      if (!proceed) return
    }
    setShipMessage(null)
    startTransition(async () => {
      const result = await markShipped(pkg.id, trimmed)
      if (result?.error) {
        setShipMessage(result.error)
      } else {
        setShipMessage(t("markShippedSuccess"))
      }
    })
  }

  return (
    <Card>
      <CardContent className="py-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="font-semibold text-slate-900">{pkg.item_name}</p>
            <p className="mt-1 text-xs text-muted-foreground">
              {pkg.profiles?.full_name} {t("suiteSeparator")} {pkg.profiles?.suite_number}
            </p>
            {pkg.tracking_number && (
              <p className="mt-1 flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground">
                <span>{t("trackingNumber")}{pkg.tracking_number}</span>
                <CarrierTrackLink trackingNumber={pkg.tracking_number} />
              </p>
            )}
            {pkg.weight_kg && (
              <p className="mt-1 text-xs text-muted-foreground">{t("weight")}{pkg.weight_kg} {t("weightUnit")}</p>
            )}
            {pkg.length_cm && pkg.width_cm && pkg.height_cm && (
              <p className="mt-1 text-xs text-muted-foreground">
                {t("dimensions")}{pkg.length_cm} x {pkg.width_cm} x {pkg.height_cm} {t("dimensionsUnit")}
              </p>
            )}
            {pkg.chargeable_weight_kg && (
              <p className="mt-1 text-xs text-muted-foreground">
                {t("chargeableWeight")}{pkg.chargeable_weight_kg} {t("weightUnit")}
              </p>
            )}
            {pkg.admin_note && (
              <p className="mt-2 text-xs text-slate-600">{pkg.admin_note}</p>
            )}
            {pkg.quote_amount != null && (
              <p className="mt-2 text-xs font-semibold text-accent">
                {t("quoteAmountLabel")}${formatUSD(pkg.quote_amount)}
                {pkg.shipping_prepaid && (
                  <span className="ml-1 font-normal text-accent">({tAdmin("prepaidBadge")})</span>
                )}
                {pkg.quote_note && (
                  <span className="ml-1 font-normal text-muted-foreground">({pkg.quote_note})</span>
                )}
                <span className="mt-1 block space-y-0.5 font-normal text-muted-foreground">
                  <span className="block">{t("quoteRecipientPhone")}{pkg.profiles?.phone_number || t("quoteRecipientNotSet")}</span>
                  <span className="block">{t("quoteRecipientAddress")}{japanAddress || t("quoteRecipientNotSet")}</span>
                </span>
              </p>
            )}
            {additionalCharges.length > 0 && (
              <div className="mt-2 space-y-1">
                {additionalCharges.map((charge) => (
                  <p key={charge.id} className="text-xs text-muted-foreground">
                    <span
                      className={`mr-1.5 inline-flex items-center rounded-full px-1.5 py-0.5 text-[10px] font-semibold ${
                        CHARGE_STATUS_BADGE_CLASS[charge.status] ?? "bg-slate-100 text-slate-700"
                      }`}
                    >
                      {tAdmin(`additionalChargeStatus.${charge.status}`)}
                    </span>
                    {tAdmin("additionalChargeLine", {
                      amount: formatUSD(charge.amount_cents / 100),
                      reason: charge.reason,
                    })}
                  </p>
                ))}
              </div>
            )}
            {declaration && (declaration.order_amount != null || declaration.origin_tracking_number) && (
              <div className="mt-2 rounded-md bg-slate-50 px-2 py-1.5 text-xs text-muted-foreground">
                <p className="font-semibold text-slate-700">{t("linkedDeclarationHeading")}</p>
                {declaration.order_amount != null && (
                  <p>{tAdmin("orderAmount")}: ${formatUSD(declaration.order_amount)}</p>
                )}
                {declaration.origin_tracking_number && (
                  <p className="flex flex-wrap items-center gap-1.5">
                    <span>{tAdmin("originTracking")}: {declaration.origin_tracking_number}</span>
                    <CarrierTrackLink trackingNumber={declaration.origin_tracking_number} />
                  </p>
                )}
              </div>
            )}
            <p className="mt-2 text-xs text-muted-foreground">
              {t("commercialInvoiceLabel")}
              {invoice ? tInvoices(INVOICE_STATUS_LABEL_KEY[invoice.status] ?? "statusDraft") : tInvoices("statusNotStarted")}
              {" · "}
              <Link href={`/admin/invoices/${pkg.id}`} className="text-accent underline">
                {invoice ? tInvoices("viewLink") : tInvoices("createLink")}
              </Link>
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Badge variant={STATUS_BADGE_VARIANT[pkg.status] ?? "outline"} className="whitespace-nowrap">
              {STATUS_OPTIONS.find((opt) => opt.value === pkg.status)?.label ?? pkg.status}
            </Badge>
            <select
              value={pkg.status}
              onChange={handleStatusChange}
              disabled={isPending}
              className="h-7 rounded-lg border border-input bg-transparent px-2 text-xs outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
            >
              {STATUS_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>

            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              onClick={handleDelete}
              disabled={isPending}
              aria-label={t("delete")}
            >
              <Trash2 className="text-destructive" />
            </Button>
          </div>
        </div>

        {statusMessage && (
          <p className="mt-2 text-xs text-destructive">{statusMessage}</p>
        )}

        {pkg.status === "paid" && (
          <div className="mt-3 flex flex-wrap items-end gap-2 rounded-lg border border-sky-200 bg-sky-50 p-3">
            <p className="w-full text-xs font-semibold text-sky-800">{t("preparingShipmentHeading")}</p>
            <div className="space-y-1">
              <Label className="text-xs font-normal text-sky-800">{t("trackingNumberFieldLabel")}</Label>
              <Input
                type="text"
                value={trackingInput}
                onChange={(e) => setTrackingInput(e.target.value)}
                placeholder={t("trackingNumberPlaceholder")}
                className="w-56"
              />
              <CarrierTrackLink trackingNumber={trackingInput} className="text-xs" />
            </div>
            <Button
              type="button"
              size="sm"
              onClick={handleMarkShipped}
              disabled={isPending}
              className="whitespace-nowrap"
            >
              {t("markShippedButton")}
            </Button>
            {shipMessage && <p className="w-full text-xs text-sky-800">{shipMessage}</p>}
          </div>
        )}

        {pkg.status !== "missing" && (
          <div className="mt-3">
            {!showChargeForm ? (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setShowChargeForm(true)}
              >
                {tAdmin("additionalChargeButton")}
              </Button>
            ) : (
              <div className="flex flex-wrap items-end gap-2 rounded-lg border border-border bg-muted/40 p-3">
                <div className="space-y-1">
                  <Label className="text-xs font-normal text-muted-foreground">
                    {tAdmin("additionalChargeReasonLabel")}
                  </Label>
                  <Input
                    type="text"
                    value={chargeReason}
                    onChange={(e) => setChargeReason(e.target.value)}
                    className="w-56"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs font-normal text-muted-foreground">
                    {tAdmin("additionalChargeAmountLabel")}
                  </Label>
                  <Input
                    type="number"
                    min="0"
                    step="0.01"
                    value={chargeAmount}
                    onChange={(e) => setChargeAmount(e.target.value)}
                    className="w-28"
                  />
                </div>
                <Button type="button" size="sm" disabled={isPending} onClick={handleCreateCharge}>
                  {tAdmin("additionalChargeSubmit")}
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  disabled={isPending}
                  onClick={() => setShowChargeForm(false)}
                >
                  {tAdmin("additionalChargeCancel")}
                </Button>
                {chargeMessage && (
                  <p className="w-full text-xs text-muted-foreground">{chargeMessage}</p>
                )}
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
