'use client'

import { useState, useTransition } from "react"
import { useTranslations } from "next-intl"
import { updatePackageStatus, deletePackage, submitQuote } from "./actions"
import { estimateQuote, type ShippingRate } from "@/lib/pricing"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent } from "@/components/ui/card"
import { Trash2 } from "lucide-react"

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
  profiles?: { full_name: string | null; suite_number: string | null } | null
}

const STATUS_BADGE_VARIANT: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  arrived: "outline",
  requested: "secondary",
  quoted: "default",
  paid: "secondary",
  shipped: "secondary",
}

export default function PackageRow({ pkg, rates }: { pkg: PackageWithProfile; rates: ShippingRate[] }) {
  const t = useTranslations("packageRow")
  const tStatus = useTranslations("packageStatus")
  const STATUS_OPTIONS = [
    { value: "arrived", label: tStatus("arrived") },
    { value: "requested", label: tStatus("requested") },
    { value: "quoted", label: tStatus("quoted") },
    { value: "paid", label: tStatus("paid") },
    { value: "shipped", label: tStatus("shipped") },
  ]
  const [isPending, startTransition] = useTransition()
  const suggestion =
    rates.length > 0
      ? estimateQuote(
          {
            weightKg: pkg.weight_kg,
            lengthCm: pkg.length_cm,
            widthCm: pkg.width_cm,
            heightCm: pkg.height_cm,
          },
          rates,
        )
      : null

  const [quoteAmount, setQuoteAmount] = useState(() =>
    suggestion?.amount != null ? String(suggestion.amount) : "",
  )
  const [quoteNote, setQuoteNote] = useState("")
  const [quoteMessage, setQuoteMessage] = useState<string | null>(null)

  function handleStatusChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const status = e.target.value
    startTransition(() => {
      updatePackageStatus(pkg.id, status)
    })
  }

  function handleDelete() {
    const ok = confirm(t("deleteConfirm", { name: pkg.item_name }))
    if (!ok) return
    startTransition(() => {
      deletePackage(pkg.id)
    })
  }

  function handleSubmitQuote() {
    const amount = Number(quoteAmount)
    if (!amount || amount <= 0) {
      setQuoteMessage(t("quoteInvalidAmount"))
      return
    }
    setQuoteMessage(null)
    startTransition(async () => {
      const result = await submitQuote(pkg.id, amount, quoteNote)
      if (result?.error) {
        setQuoteMessage(result.error)
      } else {
        setQuoteMessage(t("quoteSentSuccess"))
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
              <p className="mt-1 text-xs text-muted-foreground">{t("trackingNumber")}{pkg.tracking_number}</p>
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
                {t("quoteAmountLabel")}{Number(pkg.quote_amount).toLocaleString()}
                {pkg.quote_note && (
                  <span className="ml-1 font-normal text-muted-foreground">({pkg.quote_note})</span>
                )}
              </p>
            )}
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

        {pkg.status === "requested" && (
          <div className="mt-3 flex flex-wrap items-end gap-2 rounded-lg border border-teal-200 bg-teal-50 p-3">
            <div className="space-y-1">
              <Label className="text-xs font-normal text-teal-800">{t("quoteAmountFieldLabel")}</Label>
              <Input
                type="number"
                value={quoteAmount}
                onChange={(e) => setQuoteAmount(e.target.value)}
                className="w-32"
                placeholder={t("quoteAmountPlaceholder")}
              />
            </div>
            <div className="flex-1 space-y-1">
              <Label className="text-xs font-normal text-teal-800">{t("quoteNoteFieldLabel")}</Label>
              <Input
                type="text"
                value={quoteNote}
                onChange={(e) => setQuoteNote(e.target.value)}
                className="w-full"
              />
            </div>
            <Button
              type="button"
              size="sm"
              onClick={handleSubmitQuote}
              disabled={isPending}
              className="whitespace-nowrap"
            >
              {t("submitQuote")}
            </Button>
            {suggestion?.amount != null && (
              <p className="w-full text-xs text-teal-800">
                {t("suggestedAmount", { amount: suggestion.amount.toLocaleString() })}
              </p>
            )}
            {quoteMessage && <p className="w-full text-xs text-teal-800">{quoteMessage}</p>}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
