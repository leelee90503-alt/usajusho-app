'use client'

import { useState, useTransition } from "react"
import { useTranslations } from "next-intl"
import { resolveMissingPackage, deletePackage } from "./actions"
import { estimateQuote, type ShippingRate } from "@/lib/pricing"
import { formatUSD } from "@/lib/format"
import CarrierTrackLink from "@/components/carrier-track-link"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Check, Trash2 } from "lucide-react"

type MissingPackage = {
  id: string
  item_name: string
  tracking_number: string | null
  admin_note: string | null
  weight_kg: number | null
  length_cm: number | null
  width_cm: number | null
  height_cm: number | null
  user_id: string | null
  shipping_prepaid?: boolean
  quote_amount?: number | null
  profiles?: { full_name: string | null; suite_number: string | null } | null
}

export default function MissingPackages({
  packages,
  rates,
}: {
  packages: MissingPackage[]
  rates: ShippingRate[]
}) {
  const t = useTranslations("adminPackages")
  const [isPending, startTransition] = useTransition()
  const [errorById, setErrorById] = useState<Record<string, string>>({})
  const [successIds, setSuccessIds] = useState<Set<string>>(new Set())

  function handleResolve(id: string, params: Parameters<typeof resolveMissingPackage>[1]) {
    setErrorById((prev) => ({ ...prev, [id]: "" }))
    startTransition(async () => {
      const result = await resolveMissingPackage(id, params)
      if (result?.error) {
        setErrorById((prev) => ({ ...prev, [id]: result.error as string }))
      } else {
        setSuccessIds((prev) => new Set(prev).add(id))
      }
    })
  }

  function handleDelete(id: string) {
    const ok = window.confirm(t("confirmDeletePackage"))
    if (!ok) return
    startTransition(() => {
      deletePackage(id)
    })
  }

  if (!packages || packages.length === 0) {
    return null
  }

  return (
    <div className="mt-6">
      <h2 className="text-lg font-semibold text-foreground">
        {t("missingPackages", { count: packages.length })}
      </h2>
      <p className="mt-1 text-xs text-muted-foreground">{t("missingPackagesHint")}</p>
      <div className="mt-3 space-y-3">
        {packages.map((pkg) => (
          <MissingPackageCard
            key={pkg.id}
            pkg={pkg}
            rates={rates}
            isPending={isPending}
            error={errorById[pkg.id]}
            done={successIds.has(pkg.id)}
            onResolve={(params) => handleResolve(pkg.id, params)}
            onDelete={() => handleDelete(pkg.id)}
          />
        ))}
      </div>
    </div>
  )
}

function MissingPackageCard({
  pkg,
  rates,
  isPending,
  error,
  done,
  onResolve,
  onDelete,
}: {
  pkg: MissingPackage
  rates: ShippingRate[]
  isPending: boolean
  error?: string
  done: boolean
  onResolve: (params: Parameters<typeof resolveMissingPackage>[1]) => void
  onDelete: () => void
}) {
  const t = useTranslations("adminPackages")
  const isPrepaid = pkg.shipping_prepaid === true
  const [suiteNumber, setSuiteNumber] = useState("")
  const [weightKg, setWeightKg] = useState(pkg.weight_kg != null ? String(pkg.weight_kg) : "")
  const [lengthCm, setLengthCm] = useState(pkg.length_cm != null ? String(pkg.length_cm) : "")
  const [widthCm, setWidthCm] = useState(pkg.width_cm != null ? String(pkg.width_cm) : "")
  const [heightCm, setHeightCm] = useState(pkg.height_cm != null ? String(pkg.height_cm) : "")
  const [trackingNumber, setTrackingNumber] = useState(pkg.tracking_number ?? "")
  const [memo, setMemo] = useState(pkg.admin_note ?? "")
  const [quoteAmount, setQuoteAmount] = useState("")
  const [photos, setPhotos] = useState<File[]>([])
  const [photosError, setPhotosError] = useState<string | null>(null)

  const suggestion =
    rates.length > 0
      ? estimateQuote(
          {
            weightKg: weightKg ? Number(weightKg) : null,
            lengthCm: lengthCm ? Number(lengthCm) : null,
            widthCm: widthCm ? Number(widthCm) : null,
            heightCm: heightCm ? Number(heightCm) : null,
          },
          rates,
        )
      : null

  function handleSubmit() {
    if (photos.length < 3 || photos.length > 5) {
      setPhotosError(t("photosRequiredError"))
      return
    }
    setPhotosError(null)
    onResolve({
      suiteNumber: pkg.user_id ? undefined : suiteNumber,
      weightKg: weightKg ? Number(weightKg) : null,
      lengthCm: lengthCm ? Number(lengthCm) : null,
      widthCm: widthCm ? Number(widthCm) : null,
      heightCm: heightCm ? Number(heightCm) : null,
      trackingNumber,
      memo,
      quoteAmount: isPrepaid ? null : Number(quoteAmount),
      photos,
    })
  }

  if (done) {
    return (
      <Card>
        <CardContent className="py-4 text-sm text-accent">{t("matchSuccess")}</CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardContent className="flex flex-col gap-3 py-4">
        <div className="text-sm">
          <p className="font-semibold text-slate-900">{pkg.item_name}</p>
          {pkg.tracking_number && (
            <p className="mt-1 flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground">
              <span>{pkg.tracking_number}</span>
              <CarrierTrackLink trackingNumber={pkg.tracking_number} />
            </p>
          )}
          {pkg.user_id && (
            <p className="mt-1 text-xs text-muted-foreground">
              {pkg.profiles?.suite_number ? `#${pkg.profiles.suite_number} · ` : ""}
              {pkg.profiles?.full_name ?? ""}
            </p>
          )}
        </div>

        <div className="grid grid-cols-2 gap-3 rounded-lg border border-amber-200 bg-amber-50 p-3 sm:grid-cols-4">
          {!pkg.user_id && (
            <div className="col-span-2 space-y-1 sm:col-span-4">
              <Label className="text-xs font-normal text-amber-800">{t("matchSuiteLabel")}</Label>
              <Input
                value={suiteNumber}
                onChange={(e) => setSuiteNumber(e.target.value)}
                placeholder="USJ-001001"
                className="bg-white"
              />
            </div>
          )}
          <div className="space-y-1">
            <Label className="text-xs font-normal text-amber-800">{t("matchWeightLabel")}</Label>
            <Input
              type="number"
              step="0.01"
              value={weightKg}
              onChange={(e) => setWeightKg(e.target.value)}
              className="bg-white"
            />
          </div>
          <div className="space-y-1">
            <Label className="text-xs font-normal text-amber-800">{t("matchLengthLabel")}</Label>
            <Input
              type="number"
              step="0.1"
              value={lengthCm}
              onChange={(e) => setLengthCm(e.target.value)}
              className="bg-white"
            />
          </div>
          <div className="space-y-1">
            <Label className="text-xs font-normal text-amber-800">{t("matchWidthLabel")}</Label>
            <Input
              type="number"
              step="0.1"
              value={widthCm}
              onChange={(e) => setWidthCm(e.target.value)}
              className="bg-white"
            />
          </div>
          <div className="space-y-1">
            <Label className="text-xs font-normal text-amber-800">{t("matchHeightLabel")}</Label>
            <Input
              type="number"
              step="0.1"
              value={heightCm}
              onChange={(e) => setHeightCm(e.target.value)}
              className="bg-white"
            />
          </div>
          <div className="col-span-2 space-y-1 sm:col-span-4">
            <Label className="text-xs font-normal text-amber-800">{t("matchTrackingLabel")}</Label>
            <Input
              value={trackingNumber}
              onChange={(e) => setTrackingNumber(e.target.value)}
              className="bg-white"
            />
          </div>
          <div className="col-span-2 space-y-1 sm:col-span-4">
            <Label className="text-xs font-normal text-amber-800">{t("matchMemoLabel")}</Label>
            <Input value={memo} onChange={(e) => setMemo(e.target.value)} className="bg-white" />
          </div>
          <div className="col-span-2 space-y-1 sm:col-span-4">
            <Label className="text-xs font-normal text-amber-800">{t("photosLabel")}</Label>
            <Input
              type="file"
              accept="image/*"
              multiple
              onChange={(e) => {
                setPhotos(Array.from(e.target.files ?? []))
                setPhotosError(null)
              }}
              className="bg-white"
            />
            <p className="text-xs text-amber-800">
              {t("photosHint")} {t("photosCountLabel", { count: photos.length })}
            </p>
            {photosError && <p className="text-xs text-destructive">{photosError}</p>}
          </div>
          {isPrepaid ? (
            <div className="col-span-2 space-y-1 sm:col-span-4">
              <p className="rounded-md bg-white px-3 py-2 text-xs text-amber-800">
                {t("prepaidNotice", {
                  amount: formatUSD(pkg.quote_amount ?? 0),
                })}
              </p>
            </div>
          ) : (
            <div className="col-span-2 space-y-1">
              <Label className="text-xs font-normal text-amber-800">{t("matchQuoteAmountLabel")}</Label>
              <Input
                type="number"
                step="0.01"
                value={quoteAmount}
                onChange={(e) => setQuoteAmount(e.target.value)}
                className="bg-white"
                placeholder={suggestion?.amount != null ? String(suggestion.amount) : undefined}
              />
            </div>
          )}
          <div className="col-span-2 flex items-end sm:col-span-4">
            <Button
              type="button"
              size="sm"
              disabled={isPending}
              onClick={handleSubmit}
              className="whitespace-nowrap"
            >
              <Check className="h-4 w-4" />
              {isPrepaid ? t("confirmPrepaidButton") : t("matchAndQuote")}
            </Button>
          </div>
          {!isPrepaid && suggestion?.amount != null && (
            <p className="col-span-2 w-full text-xs text-amber-800 sm:col-span-4">
              {t("suggestedAmountShort", { amount: formatUSD(suggestion.amount) })}
            </p>
          )}
          {error && <p className="col-span-2 w-full text-xs text-destructive sm:col-span-4">{error}</p>}
        </div>

        <div className="flex justify-end">
          <Button type="button" variant="ghost" size="sm" disabled={isPending} onClick={onDelete}>
            <Trash2 className="h-4 w-4" />
            {t("deletePackage")}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
