'use client'

import { useState, useTransition } from "react"
import { useTranslations } from "next-intl"
import { matchAndQuoteDeclaration, adminDeleteDeclaration } from "./declarations-actions"
import { estimateQuote, type ShippingRate } from "@/lib/pricing"
import { formatUSD } from "@/lib/format"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Check, Trash2 } from "lucide-react"

type Declaration = {
  id: string
  item_name: string
  order_amount: number | null
  origin_tracking_number: string | null
  note: string | null
  receipt_url: string | null
  created_at: string
  profiles: { full_name: string | null; suite_number: string | null } | null
}

export default function PendingDeclarations({
  declarations,
  rates,
}: {
  declarations: Declaration[]
  rates: ShippingRate[]
}) {
  const t = useTranslations("adminPackages")
  const [isPending, startTransition] = useTransition()
  const [errorByDeclarationId, setErrorByDeclarationId] = useState<Record<string, string>>({})
  const [successIds, setSuccessIds] = useState<Set<string>>(new Set())

  function handleMatch(declarationId: string, params: Parameters<typeof matchAndQuoteDeclaration>[1]) {
    setErrorByDeclarationId((prev) => ({ ...prev, [declarationId]: "" }))
    startTransition(async () => {
      const result = await matchAndQuoteDeclaration(declarationId, params)
      if (result?.error) {
        setErrorByDeclarationId((prev) => ({ ...prev, [declarationId]: result.error as string }))
      } else {
        setSuccessIds((prev) => new Set(prev).add(declarationId))
      }
    })
  }

  function handleDelete(id: string) {
    if (!window.confirm(t("confirmDeleteDeclaration"))) {
      return
    }
    startTransition(async () => {
      await adminDeleteDeclaration(id)
    })
  }

  if (!declarations || declarations.length === 0) {
    return null
  }

  return (
    <div className="mt-6">
      <h2 className="text-lg font-semibold text-foreground">
        {t("pendingDeclarations", { count: declarations.length })}
      </h2>
      <div className="mt-3 space-y-3">
        {declarations.map((d) => (
          <DeclarationCard
            key={d.id}
            declaration={d}
            rates={rates}
            isPending={isPending}
            error={errorByDeclarationId[d.id]}
            done={successIds.has(d.id)}
            onMatch={(params) => handleMatch(d.id, params)}
            onDelete={() => handleDelete(d.id)}
          />
        ))}
      </div>
    </div>
  )
}

function DeclarationCard({
  declaration: d,
  rates,
  isPending,
  error,
  done,
  onMatch,
  onDelete,
}: {
  declaration: Declaration
  rates: ShippingRate[]
  isPending: boolean
  error?: string
  done: boolean
  onMatch: (params: Parameters<typeof matchAndQuoteDeclaration>[1]) => void
  onDelete: () => void
}) {
  const t = useTranslations("adminPackages")
  const [itemName, setItemName] = useState(d.item_name)
  const [weightKg, setWeightKg] = useState("")
  const [lengthCm, setLengthCm] = useState("")
  const [widthCm, setWidthCm] = useState("")
  const [heightCm, setHeightCm] = useState("")
  const [trackingNumber, setTrackingNumber] = useState("")
  const [memo, setMemo] = useState("")
  const [quoteAmount, setQuoteAmount] = useState("")

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
    onMatch({
      itemName,
      weightKg: weightKg ? Number(weightKg) : null,
      lengthCm: lengthCm ? Number(lengthCm) : null,
      widthCm: widthCm ? Number(widthCm) : null,
      heightCm: heightCm ? Number(heightCm) : null,
      trackingNumber,
      memo,
      quoteAmount: Number(quoteAmount),
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
          <p className="font-semibold text-slate-900">
            {d.profiles?.suite_number ? `#${d.profiles.suite_number} · ` : ""}
            {d.profiles?.full_name ?? "-"}
          </p>
          <p className="mt-1">{d.item_name}</p>
          {d.order_amount != null && (
            <p className="mt-1 text-xs text-muted-foreground">
              {t("orderAmount")}: ${formatUSD(d.order_amount)}
            </p>
          )}
          {d.origin_tracking_number && (
            <p className="mt-1 text-xs text-muted-foreground">
              {t("originTracking")}: {d.origin_tracking_number}
            </p>
          )}
          {d.note && <p className="mt-1 text-xs text-slate-600">{d.note}</p>}
          {d.receipt_url && (
            <a
              href={d.receipt_url}
              target="_blank"
              rel="noreferrer"
              className="mt-1 inline-block text-xs text-primary underline"
            >
              {t("viewReceipt")}
            </a>
          )}
        </div>

        <div className="grid grid-cols-2 gap-3 rounded-lg border border-teal-200 bg-teal-50 p-3 sm:grid-cols-4">
          <div className="col-span-2 space-y-1 sm:col-span-4">
            <Label className="text-xs font-normal text-teal-800">{t("matchItemNameLabel")}</Label>
            <Input value={itemName} onChange={(e) => setItemName(e.target.value)} className="bg-white" />
          </div>
          <div className="space-y-1">
            <Label className="text-xs font-normal text-teal-800">{t("matchWeightLabel")}</Label>
            <Input
              type="number"
              step="0.01"
              value={weightKg}
              onChange={(e) => setWeightKg(e.target.value)}
              className="bg-white"
            />
          </div>
          <div className="space-y-1">
            <Label className="text-xs font-normal text-teal-800">{t("matchLengthLabel")}</Label>
            <Input
              type="number"
              step="0.1"
              value={lengthCm}
              onChange={(e) => setLengthCm(e.target.value)}
              className="bg-white"
            />
          </div>
          <div className="space-y-1">
            <Label className="text-xs font-normal text-teal-800">{t("matchWidthLabel")}</Label>
            <Input
              type="number"
              step="0.1"
              value={widthCm}
              onChange={(e) => setWidthCm(e.target.value)}
              className="bg-white"
            />
          </div>
          <div className="space-y-1">
            <Label className="text-xs font-normal text-teal-800">{t("matchHeightLabel")}</Label>
            <Input
              type="number"
              step="0.1"
              value={heightCm}
              onChange={(e) => setHeightCm(e.target.value)}
              className="bg-white"
            />
          </div>
          <div className="col-span-2 space-y-1 sm:col-span-4">
            <Label className="text-xs font-normal text-teal-800">{t("matchTrackingLabel")}</Label>
            <Input
              value={trackingNumber}
              onChange={(e) => setTrackingNumber(e.target.value)}
              className="bg-white"
            />
          </div>
          <div className="col-span-2 space-y-1 sm:col-span-4">
            <Label className="text-xs font-normal text-teal-800">{t("matchMemoLabel")}</Label>
            <Input value={memo} onChange={(e) => setMemo(e.target.value)} className="bg-white" />
          </div>
          <div className="col-span-2 space-y-1">
            <Label className="text-xs font-normal text-teal-800">{t("matchQuoteAmountLabel")}</Label>
            {suggestion?.amount != null && (
              <p className="text-xs text-teal-800">
                {t("suggestedAmountShort", { amount: suggestion.amount.toLocaleString() })}
                {" "}
                <button
                  type="button"
                  onClick={() => setQuoteAmount(String(suggestion.amount))}
                  className="underline underline-offset-2"
                >
                  {t("useSuggestedAmount")}
                </button>
              </p>
            )}
            <Input
              type="number"
              value={quoteAmount}
              onChange={(e) => setQuoteAmount(e.target.value)}
              className="bg-white"
              placeholder="0.00"
            />
          </div>
          <div className="col-span-2 flex items-end sm:col-span-4">
            <Button
              type="button"
              size="sm"
              disabled={isPending}
              onClick={handleSubmit}
              className="whitespace-nowrap"
            >
              <Check className="h-4 w-4" />
              {t("matchAndQuote")}
            </Button>
          </div>
          {error && <p className="col-span-2 w-full text-xs text-destructive sm:col-span-4">{error}</p>}
        </div>

        <div className="flex justify-end">
          <Button type="button" variant="ghost" size="sm" disabled={isPending} onClick={onDelete}>
            <Trash2 className="h-4 w-4" />
            {t("deleteDeclaration")}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
