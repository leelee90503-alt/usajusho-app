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
import { estimatePurchaseAgencyFee } from "@/lib/purchase-agency-pricing"

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

export default function RequestRow({ request }: { request: PurchaseRequest }) {
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
    const estimate = estimatePurchaseAgencyFee(priceCents)
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
    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
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
              className="mt-0.5 block break-all text-xs text-teal-700 hover:underline"
            >
              {request.product_url}
            </a>
          )}
          <p className="mt-1 text-xs text-slate-400">
            {request.profiles?.full_name ?? "-"}
            {request.profiles?.suite_number
              ? ` (#${request.profiles.suite_number})`
              : ""}
          </p>
          {request.budget_cap_cents != null && (
            <p className="mt-1 text-xs text-slate-500">
              {t("budgetCapLabel")}: $
              {(request.budget_cap_cents / 100).toLocaleString()}
            </p>
          )}
        </div>
        <span
          className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-medium ${
            STATUS_STYLES[request.status] ?? "bg-slate-100 text-slate-700"
          }`}
        >
          {t(`status.${request.status}`)}
        </span>
      </div>

      {(request.status === "submitted" || request.status === "quote_sent") && (
        <div className="mt-4 rounded-lg border border-slate-200 bg-slate-50 p-3">
          <h3 className="text-xs font-semibold text-slate-700">
            {t("writeQuoteTitle")}
          </h3>
          <div className="mt-2 flex flex-wrap items-end gap-2">
            <div>
              <label className="block text-xs text-slate-500">
                {t("itemPriceLabel")}
              </label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={itemPrice}
                onChange={(e) => setItemPrice(e.target.value)}
                className="mt-1 w-28 rounded-md border border-slate-300 px-2 py-1 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs text-slate-500">
                {t("feeLabel")}
              </label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={fee}
                onChange={(e) => setFee(e.target.value)}
                className="mt-1 w-24 rounded-md border border-slate-300 px-2 py-1 text-sm"
              />
            </div>
            <button
              type="button"
              onClick={handleSuggestFee}
              className="rounded-md border border-slate-300 px-2 py-1 text-xs text-slate-600 hover:bg-slate-100"
            >
              {t("suggestFeeButton")}
            </button>
            <div>
              <label className="block text-xs text-slate-500">
                {t("expiresAtLabel")}
              </label>
              <input
                type="date"
                value={expiresAt}
                onChange={(e) => setExpiresAt(e.target.value)}
                className="mt-1 rounded-md border border-slate-300 px-2 py-1 text-sm"
              />
            </div>
          </div>
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder={t("quoteNotePlaceholder")}
            rows={2}
            className="mt-2 w-full rounded-md border border-slate-300 px-2 py-1 text-sm"
          />
          <button
            type="button"
            disabled={isPending}
            onClick={handleSendQuote}
            className="mt-2 rounded-md bg-slate-900 px-3 py-1.5 text-xs font-semibold text-white hover:bg-slate-800 disabled:opacity-50"
          >
            {t("sendQuoteButton")}
          </button>
        </div>
      )}

      {request.status === "paid" && (
        <div className="mt-4 flex items-center gap-2">
          <button
            type="button"
            disabled={isPending}
            onClick={handleMarkPurchasing}
            className="rounded-md bg-slate-900 px-3 py-1.5 text-xs font-semibold text-white hover:bg-slate-800 disabled:opacity-50"
          >
            {t("markPurchasingButton")}
          </button>
          <button
            type="button"
            disabled={isPending}
            onClick={handleRefund}
            className="rounded-md border border-red-300 px-3 py-1.5 text-xs font-semibold text-red-700 hover:bg-red-50 disabled:opacity-50"
          >
            {t("refundButton")}
          </button>
        </div>
      )}

      {request.status === "purchasing" && (
        <div className="mt-4 flex flex-wrap items-end gap-2">
          <div>
            <label className="block text-xs text-slate-500">
              {t("packageItemNameLabel")}
            </label>
            <input
              type="text"
              value={itemName}
              onChange={(e) => setItemName(e.target.value)}
              className="mt-1 w-64 rounded-md border border-slate-300 px-2 py-1 text-sm"
            />
          </div>
          <button
            type="button"
            disabled={isPending}
            onClick={handleMarkPurchased}
            className="rounded-md bg-slate-900 px-3 py-1.5 text-xs font-semibold text-white hover:bg-slate-800 disabled:opacity-50"
          >
            {t("markPurchasedButton")}
          </button>
        </div>
      )}

      {request.linked_package_id && (
        <p className="mt-3 text-xs text-slate-500">
          {t("linkedPackageLabel")}:{" "}
          <Link
            href="/admin/packages"
            className="text-teal-700 hover:underline"
          >
            {request.linked_package_id}
          </Link>
        </p>
      )}

      {["submitted", "quote_sent", "awaiting_payment"].includes(
        request.status,
      ) && (
        <button
          type="button"
          disabled={isPending}
          onClick={handleCancel}
          className="mt-3 text-xs text-slate-400 hover:text-slate-600 hover:underline"
        >
          {t("cancelButton")}
        </button>
      )}

      {message && <p className="mt-2 text-xs text-teal-700">{message}</p>}
    </div>
  )
}
