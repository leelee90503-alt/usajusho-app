"use client"

import { useState, useTransition } from "react"
import { useTranslations } from "next-intl"
import { Link } from "@/i18n/navigation"
import {
  sendQuote,
  markPurchasing,
  markPurchasedAndLinkPackage,
  refundPurchaseRequest,
  cancelRequestAsAdmin,
} from "./actions"
import {
  estimatePurchaseAgencyFee,
  type PurchaseAgencyFeeSettings,
} from "@/lib/purchase-agency-pricing"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent } from "@/components/ui/card"
import { formatUSD } from "@/lib/format"

type Profile = { full_name: string | null; suite_number: string | null } | null

type PurchaseRequest = {
  id: string
  product_url: string | null
  product_description: string
  budget_cap_cents: number | null
  status: string
  quote_item_price_cents: number | null
  quote_fee_cents: number | null
  quote_total_cents: number | null
  quote_note: string | null
  quote_expires_at: string | null
  linked_package_id: string | null
  profiles: Profile
}

const STATUS_STYLES: Record<string, string> = {
  submitted: "bg-slate-100 text-slate-700",
  quote_sent: "bg-amber-100 text-amber-800",
  awaiting_payment: "bg-amber-100 text-amber-800",
  paid: "bg-teal-100 text-teal-800",
  purchasing: "bg-teal-100 text-teal-800",
  purchased: "bg-teal-100 text-teal-800",
  cancelled: "bg-slate-100 text-slate-500",
  refunded: "bg-slate-100 text-slate-500",
}

export default function RequestRow({
  request,
  feeSettings,
}: {
  request: PurchaseRequest
  feeSettings: PurchaseAgencyFeeSettings
}) {
  const t = useTranslations("adminPurchaseRequests")
  const [isPending, startTransition] = useTransition()
  const [message, setMessage] = useState<string | null>(null)

  const [itemPrice, setItemPrice] = useState(() =>
    request.quote_item_price_cents != null
      ? String(request.quote_item_price_cents / 100)
      : "",
  )
  const [fee, setFee] = useState(() =>
    request.quote_fee_cents != null ? String(request.quote_fee_cents / 100) : "",
  )
  const [note, setNote] = useState(request.quote_note ?? "")
  const [expiresAt, setExpiresAt] = useState(
    request.quote_expires_at ? request.quote_expires_at.slice(0, 10) : "",
  )
  const [itemName, setItemName] = useState(
    request.product_description.slice(0, 80),
  )

  function handleSuggestFee() {
    const priceCents = Math.round(Number(itemPrice || "0") * 100)
    if (!priceCents) return
    const estimate = estimatePurchaseAgencyFee(priceCents, feeSettings)
    setFee(String(estimate.feeCents / 100))
  }

  function handleSendQuote() {
    const priceCents = Math.round(Number(itemPrice) * 100)
    const feeCents = Math.round(Number(fee) * 100)
    if (!priceCents || Number.isNaN(feeCents)) {
      setMessage(t("quoteInvalid"))
      return
    }
    setMessage(null)
    startTransition(async () => {
      const result = await sendQuote(
        request.id,
        priceCents,
        feeCents,
        note,
        expiresAt ? new Date(expiresAt).toISOString() : null,
      )
      setMessage(result?.error ?? t("quoteSentSuccess"))
    })
  }

  function handleMarkPurchasing() {
    setMessage(null)
    startTransition(async () => {
      const result = await markPurchasing(request.id)
      setMessage(result?.error ?? null)
    })
  }

  function handleMarkPurchased() {
    setMessage(null)
    startTransition(async () => {
      const result = await markPurchasedAndLinkPackage(request.id, itemName)
      setMessage(result?.error ?? t("purchasedSuccess"))
    })
  }

  function handleRefund() {
    const ok = confirm(t("refundConfirm"))
    if (!ok) return
    setMessage(null)
    startTransition(async () => {
      const result = await refundPurchaseRequest(request.id)
      setMessage(result?.error ?? t("refundSuccess"))
    })
  }

  function handleCancel() {
    const ok = confirm(t("cancelConfirm"))
    if (!ok) return
    setMessage(null)
    startTransition(async () => {
      const result = await cancelRequestAsAdmin(request.id)
      setMessage(result?.error ?? null)
    })
  }

  return (
    <Card>
      <CardContent className="py-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="font-semibold text-slate-900">
              {request.product_description}
            </p>
            {request.product_url && (
              <a
                href={request.product_url}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-0.5 block break-all text-xs text-accent hover:underline"
              >
                {request.product_url}
              </a>
            )}
            <p className="mt-1 text-xs text-muted-foreground">
              {request.profiles?.full_name ?? "-"}
              {request.profiles?.suite_number
                ? ` (#${request.profiles.suite_number})`
                : ""}
            </p>
            {request.budget_cap_cents != null && (
              <p className="mt-1 text-xs text-muted-foreground">
                {t("budgetCapLabel")}: $
                {formatUSD(request.budget_cap_cents / 100)}
              </p>
            )}
          </div>
          <Badge
            className={`shrink-0 ${STATUS_STYLES[request.status] ?? "bg-slate-100 text-slate-700"}`}
          >
            {t(`status.${request.status}`)}
          </Badge>
        </div>

        {(request.status === "submitted" || request.status === "quote_sent") && (
          <div className="mt-4 rounded-lg border border-border bg-muted/40 p-3">
            <h3 className="text-xs font-semibold text-foreground">
              {t("writeQuoteTitle")}
            </h3>
            <div className="mt-2 flex flex-wrap items-end gap-2">
              <div className="space-y-1">
                <Label htmlFor={`item-price-${request.id}`} className="text-xs font-normal text-muted-foreground">
                  {t("itemPriceLabel")}
                </Label>
                <Input
                  id={`item-price-${request.id}`}
                  type="number"
                  min="0"
                  step="0.01"
                  value={itemPrice}
                  onChange={(e) => setItemPrice(e.target.value)}
                  className="w-28"
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor={`fee-${request.id}`} className="text-xs font-normal text-muted-foreground">
                  {t("feeLabel")}
                </Label>
                <Input
                  id={`fee-${request.id}`}
                  type="number"
                  min="0"
                  step="0.01"
                  value={fee}
                  onChange={(e) => setFee(e.target.value)}
                  className="w-24"
                />
              </div>
              <Button type="button" variant="outline" size="sm" onClick={handleSuggestFee}>
                {t("suggestFeeButton")}
              </Button>
              <div className="space-y-1">
                <Label htmlFor={`expires-${request.id}`} className="text-xs font-normal text-muted-foreground">
                  {t("expiresAtLabel")}
                </Label>
                <Input
                  id={`expires-${request.id}`}
                  type="date"
                  value={expiresAt}
                  onChange={(e) => setExpiresAt(e.target.value)}
                  className="w-auto"
                />
              </div>
            </div>
            <Textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder={t("quoteNotePlaceholder")}
              rows={2}
              className="mt-2"
            />
            <Button
              type="button"
              size="sm"
              disabled={isPending}
              onClick={handleSendQuote}
              className="mt-2"
            >
              {t("sendQuoteButton")}
            </Button>
          </div>
        )}

        {request.status === "paid" && (
          <div className="mt-4 flex items-center gap-2">
            <Button type="button" size="sm" disabled={isPending} onClick={handleMarkPurchasing}>
              {t("markPurchasingButton")}
            </Button>
            <Button
              type="button"
              variant="destructive"
              size="sm"
              disabled={isPending}
              onClick={handleRefund}
            >
              {t("refundButton")}
            </Button>
          </div>
        )}

        {request.status === "purchasing" && (
          <div className="mt-4 flex flex-wrap items-end gap-2">
            <div className="space-y-1">
              <Label htmlFor={`item-name-${request.id}`} className="text-xs font-normal text-muted-foreground">
                {t("packageItemNameLabel")}
              </Label>
              <Input
                id={`item-name-${request.id}`}
                type="text"
                value={itemName}
                onChange={(e) => setItemName(e.target.value)}
                className="w-64"
              />
            </div>
            <Button type="button" size="sm" disabled={isPending} onClick={handleMarkPurchased}>
              {t("markPurchasedButton")}
            </Button>
          </div>
        )}

        {request.linked_package_id && (
          <p className="mt-3 text-xs text-muted-foreground">
            {t("linkedPackageLabel")}:{" "}
            <Link href="/admin/packages" className="text-accent hover:underline">
              {request.linked_package_id}
            </Link>
          </p>
        )}

        {["submitted", "quote_sent", "awaiting_payment"].includes(
          request.status,
        ) && (
          <Button
            type="button"
            variant="link"
            size="sm"
            disabled={isPending}
            onClick={handleCancel}
            className="mt-3 h-auto p-0 text-xs text-muted-foreground hover:text-foreground"
          >
            {t("cancelButton")}
          </Button>
        )}

        {message && <p className="mt-2 text-xs text-accent">{message}</p>}
      </CardContent>
    </Card>
  )
}
