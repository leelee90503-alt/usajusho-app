
"use client"

import { useState, useTransition } from "react"
import {
  adminUpdateInvoiceHeader,
  adminAddInvoiceItem,
  adminUpdateInvoiceItem,
  adminDeleteInvoiceItem,
  adminDuplicateInvoiceItem,
  adminSubmitOnBehalf,
  adminRequestCorrection,
  adminApproveAndComplete,
} from "../actions"

type InvoiceItem = {
  id: string
  product_name: string
  quantity: number
  unit_price: number
  item_total_amount: number
  country_of_origin: string | null
  hs_code: string | null
  sort_order: number
}

type Invoice = {
  id: string
  status: string
  invoice_number: string | null
  invoice_issue_date: string | null
  shipment_reference_number: string | null
  shipper_name: string | null
  shipper_address: string | null
  consignee_name: string | null
  consignee_address: string | null
  reason_for_export: string | null
  currency: string
  shipping_terms: string | null
  shipping_cost: number | null
  insurance_premium: number | null
  other_costs: number | null
  total_declared_value: number
  correction_note: string | null
  invoice_items: InvoiceItem[]
}

type Labels = Record<string, string>

const STATUS_LABEL_KEY: Record<string, string> = {
  draft: "statusDraft",
  customer_submitted: "statusSubmitted",
  correction_required: "statusCorrectionRequired",
  admin_review: "statusAdminReview",
  complete: "statusComplete",
}

export default function AdminInvoiceForm({
  invoice: initialInvoice,
  labels,
}: {
  invoice: Invoice
  labels: Labels
}) {
  const [invoice, setInvoice] = useState(initialInvoice)
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)
  const [newItem, setNewItem] = useState({
    product_name: "",
    quantity: "1",
    unit_price: "0",
    country_of_origin: "",
    hs_code: "",
  })
  const [correctionNote, setCorrectionNote] = useState("")
  const [showCorrectionBox, setShowCorrectionBox] = useState(false)
  const [confirmAction, setConfirmAction] = useState<null | "submit" | "complete">(null)
  const [editWhenCompleteConfirmed, setEditWhenCompleteConfirmed] = useState(false)

  const items = [...invoice.invoice_items].sort((a, b) => a.sort_order - b.sort_order)
  const isComplete = invoice.status === "complete"

  function guardEditWhenComplete(): boolean {
    if (isComplete && !editWhenCompleteConfirmed) {
      const ok = window.confirm(labels.editCompleteConfirm)
      if (ok) {
        setEditWhenCompleteConfirmed(true)
        return true
      }
      return false
    }
    return true
  }

  function refreshField<K extends keyof Invoice>(key: K, value: Invoice[K]) {
    setInvoice((prev) => ({ ...prev, [key]: value }))
  }

  function handleHeaderBlur(field: string, value: string) {
    if (!guardEditWhenComplete()) return
    startTransition(async () => {
      const res = await adminUpdateInvoiceHeader(invoice.id, { [field]: value })
      if (res?.error) setError(res.error)
      else setError(null)
    })
  }

  function handleAddItem() {
    if (!guardEditWhenComplete()) return
    setError(null)
    startTransition(async () => {
      const res = await adminAddInvoiceItem(invoice.id, {
        product_name: newItem.product_name,
        quantity: Number(newItem.quantity),
        unit_price: Number(newItem.unit_price),
        country_of_origin: newItem.country_of_origin || undefined,
        hs_code: newItem.hs_code || undefined,
      })
      if (res?.error) {
        setError(res.error)
        return
      }
      setNewItem({ product_name: "", quantity: "1", unit_price: "0", country_of_origin: "", hs_code: "" })
      window.location.reload()
    })
  }

  function handleDeleteItem(itemId: string) {
    if (!guardEditWhenComplete()) return
    startTransition(async () => {
      const res = await adminDeleteInvoiceItem(itemId)
      if (res?.error) setError(res.error)
      else window.location.reload()
    })
  }

  function handleDuplicateItem(itemId: string) {
    if (!guardEditWhenComplete()) return
    startTransition(async () => {
      const res = await adminDuplicateInvoiceItem(itemId)
      if (res?.error) setError(res.error)
      else window.location.reload()
    })
  }

  function handleItemFieldChange(itemId: string, field: string, value: string) {
    setInvoice((prev) => ({
      ...prev,
      invoice_items: prev.invoice_items.map((it) =>
        it.id === itemId ? { ...it, [field]: value } : it
      ),
    }))
  }

  function handleItemBlur(itemId: string, field: string, value: string) {
    if (!guardEditWhenComplete()) return
    startTransition(async () => {
      const payload: Record<string, string | number> =
        field === "quantity" || field === "unit_price" ? { [field]: Number(value) } : { [field]: value }
      const res = await adminUpdateInvoiceItem(itemId, payload)
      if (res?.error) setError(res.error)
      else window.location.reload()
    })
  }

  function handleSubmitOnBehalf() {
    setError(null)
    startTransition(async () => {
      const res = await adminSubmitOnBehalf(invoice.id)
      if (res?.error) {
        setError(res.error)
        return
      }
      setConfirmAction(null)
      window.location.reload()
    })
  }

  function handleRequestCorrection() {
    if (!correctionNote.trim()) {
      setError(labels.correctionNoteRequired)
      return
    }
    setError(null)
    startTransition(async () => {
      const res = await adminRequestCorrection(invoice.id, correctionNote)
      if (res?.error) {
        setError(res.error)
        return
      }
      setNotice(labels.correctionSentSuccess)
      window.location.reload()
    })
  }

  function handleApproveComplete() {
    setError(null)
    startTransition(async () => {
      const res = await adminApproveAndComplete(invoice.id)
      if (res?.error) {
        setError(res.error)
        return
      }
      setConfirmAction(null)
      window.location.reload()
    })
  }

  return (
    <div className="mt-8 rounded-xl border border-slate-200 bg-white p-6">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-4">
        <div>
          <h2 className="text-lg font-semibold text-slate-900">{labels.title}</h2>
          {invoice.invoice_number && (
            <p className="mt-1 text-xs text-slate-500">{invoice.invoice_number}</p>
          )}
        </div>
        <span className="whitespace-nowrap rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
          {labels[STATUS_LABEL_KEY[invoice.status]] || invoice.status}
        </span>
      </div>

      {invoice.status === "correction_required" && invoice.correction_note && (
        <div className="mt-4 rounded-lg border border-amber-200 bg-amber-50 p-4">
          <p className="text-xs font-semibold text-amber-800">{labels.correctionBannerTitle}</p>
          <p className="mt-1 text-sm text-amber-700">{invoice.correction_note}</p>
        </div>
      )}

      {error && (
        <p className="mt-4 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
      )}
      {notice && (
        <p className="mt-4 rounded-md bg-emerald-50 px-3 py-2 text-sm text-emerald-700">{notice}</p>
      )}

      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
        <HeaderField
          label={labels.shipperName}
          value={invoice.shipper_name || ""}
          onChange={(v) => refreshField("shipper_name", v)}
          onBlur={(v) => handleHeaderBlur("shipper_name", v)}
        />
        <HeaderField
          label={labels.shipperAddress}
          value={invoice.shipper_address || ""}
          onChange={(v) => refreshField("shipper_address", v)}
          onBlur={(v) => handleHeaderBlur("shipper_address", v)}
        />
        <HeaderField
          label={labels.consigneeName}
          value={invoice.consignee_name || ""}
          onChange={(v) => refreshField("consignee_name", v)}
          onBlur={(v) => handleHeaderBlur("consignee_name", v)}
        />
        <HeaderField
          label={labels.consigneeAddress}
          value={invoice.consignee_address || ""}
          onChange={(v) => refreshField("consignee_address", v)}
          onBlur={(v) => handleHeaderBlur("consignee_address", v)}
        />
        <HeaderField
          label={labels.reasonForExport}
          value={invoice.reason_for_export || ""}
          onChange={(v) => refreshField("reason_for_export", v)}
          onBlur={(v) => handleHeaderBlur("reason_for_export", v)}
        />
        <HeaderField
          label={labels.shippingTerms}
          value={invoice.shipping_terms || ""}
          onChange={(v) => refreshField("shipping_terms", v)}
          onBlur={(v) => handleHeaderBlur("shipping_terms", v)}
        />
      </div>

      <div className="mt-8">
        <h3 className="text-sm font-semibold text-slate-900">{labels.lineItemsTitle}</h3>
        <div className="mt-3 overflow-x-auto">
          <table className="w-full min-w-[640px] text-sm">
            <thead>
              <tr className="text-left text-xs text-slate-500">
                <th className="pb-2">{labels.productName}</th>
                <th className="pb-2">{labels.quantity}</th>
                <th className="pb-2">{labels.unitPrice}</th>
                <th className="pb-2">{labels.itemTotal}</th>
                <th className="pb-2">{labels.countryOfOrigin}</th>
                <th className="pb-2">{labels.hsCode}</th>
                <th className="pb-2" />
              </tr>
            </thead>
            <tbody>
              {items.map((item) => (
                <tr key={item.id} className="border-t border-slate-100">
                  <td className="py-2 pr-2">
                    <input
                      className="w-full rounded border border-slate-200 px-2 py-1 text-sm"
                      value={item.product_name}
                      onChange={(e) => handleItemFieldChange(item.id, "product_name", e.target.value)}
                      onBlur={(e) => handleItemBlur(item.id, "product_name", e.target.value)}
                    />
                  </td>
                  <td className="py-2 pr-2">
                    <input
                      type="number"
                      className="w-20 rounded border border-slate-200 px-2 py-1 text-sm"
                      value={item.quantity}
                      onChange={(e) => handleItemFieldChange(item.id, "quantity", e.target.value)}
                      onBlur={(e) => handleItemBlur(item.id, "quantity", e.target.value)}
                    />
                  </td>
                  <td className="py-2 pr-2">
                    <input
                      type="number"
                      className="w-24 rounded border border-slate-200 px-2 py-1 text-sm"
                      value={item.unit_price}
                      onChange={(e) => handleItemFieldChange(item.id, "unit_price", e.target.value)}
                      onBlur={(e) => handleItemBlur(item.id, "unit_price", e.target.value)}
                    />
                  </td>
                  <td className="py-2 pr-2 font-medium text-slate-700">
                    {labels.currencySymbol}
                    {Number(item.item_total_amount).toLocaleString()}
                  </td>
                  <td className="py-2 pr-2">
                    <input
                      className="w-24 rounded border border-slate-200 px-2 py-1 text-sm"
                      value={item.country_of_origin || ""}
                      onChange={(e) => handleItemFieldChange(item.id, "country_of_origin", e.target.value)}
                      onBlur={(e) => handleItemBlur(item.id, "country_of_origin", e.target.value)}
                    />
                  </td>
                  <td className="py-2 pr-2">
                    <input
                      className="w-24 rounded border border-slate-200 px-2 py-1 text-sm"
                      value={item.hs_code || ""}
                      onChange={(e) => handleItemFieldChange(item.id, "hs_code", e.target.value)}
                      onBlur={(e) => handleItemBlur(item.id, "hs_code", e.target.value)}
                    />
                  </td>
                  <td className="py-2 whitespace-nowrap">
                    <button
                      type="button"
                      className="mr-2 text-xs text-teal-700 hover:underline"
                      onClick={() => handleDuplicateItem(item.id)}
                    >
                      {labels.duplicate}
                    </button>
                    <button
                      type="button"
                      className="text-xs text-red-600 hover:underline"
                      onClick={() => handleDeleteItem(item.id)}
                    >
                      {labels.delete}
                    </button>
                  </td>
                </tr>
              ))}
              {items.length === 0 && (
                <tr>
                  <td colSpan={7} className="py-4 text-center text-xs text-slate-400">
                    {labels.noItems}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="mt-4 flex flex-wrap items-end gap-2 rounded-lg bg-slate-50 p-3">
          <input
            className="w-40 rounded border border-slate-200 px-2 py-1.5 text-sm"
            placeholder={labels.productName}
            value={newItem.product_name}
            onChange={(e) => setNewItem((s) => ({ ...s, product_name: e.target.value }))}
          />
          <input
            type="number"
            className="w-20 rounded border border-slate-200 px-2 py-1.5 text-sm"
            placeholder={labels.quantity}
            value={newItem.quantity}
            onChange={(e) => setNewItem((s) => ({ ...s, quantity: e.target.value }))}
          />
          <input
            type="number"
            className="w-24 rounded border border-slate-200 px-2 py-1.5 text-sm"
            placeholder={labels.unitPrice}
            value={newItem.unit_price}
            onChange={(e) => setNewItem((s) => ({ ...s, unit_price: e.target.value }))}
          />
          <input
            className="w-24 rounded border border-slate-200 px-2 py-1.5 text-sm"
            placeholder={labels.countryOfOrigin}
            value={newItem.country_of_origin}
            onChange={(e) => setNewItem((s) => ({ ...s, country_of_origin: e.target.value }))}
          />
          <input
            className="w-24 rounded border border-slate-200 px-2 py-1.5 text-sm"
            placeholder={labels.hsCode}
            value={newItem.hs_code}
            onChange={(e) => setNewItem((s) => ({ ...s, hs_code: e.target.value }))}
          />
          <button
            type="button"
            disabled={isPending || !newItem.product_name.trim()}
            onClick={handleAddItem}
            className="rounded-md bg-teal-700 px-3 py-1.5 text-sm font-semibold text-white hover:bg-teal-800 disabled:opacity-50"
          >
            {labels.addItem}
          </button>
        </div>
      </div>

      <div className="mt-6 flex items-center justify-between border-t border-slate-100 pt-4">
        <p className="text-sm font-semibold text-slate-900">{labels.totalDeclaredValue}</p>
        <p className="text-lg font-bold text-teal-700">
          {labels.currencySymbol}
          {Number(invoice.total_declared_value).toLocaleString()}
        </p>
      </div>

      <div className="mt-6 flex flex-wrap justify-end gap-3">
        {(invoice.status === "draft" || invoice.status === "correction_required") && (
          <button
            type="button"
            disabled={isPending}
            onClick={() => setConfirmAction("submit")}
            className="rounded-md bg-teal-700 px-4 py-2 text-sm font-semibold text-white hover:bg-teal-800 disabled:opacity-50"
          >
            {labels.submitOnBehalf}
          </button>
        )}

        {invoice.status === "customer_submitted" && (
          <>
            <button
              type="button"
              disabled={isPending}
              onClick={() => setShowCorrectionBox((v) => !v)}
              className="rounded-md border border-amber-300 bg-amber-50 px-4 py-2 text-sm font-semibold text-amber-800 hover:bg-amber-100 disabled:opacity-50"
            >
              {labels.requestCorrection}
            </button>
            <button
              type="button"
              disabled={isPending}
              onClick={() => setConfirmAction("complete")}
              className="rounded-md bg-teal-700 px-4 py-2 text-sm font-semibold text-white hover:bg-teal-800 disabled:opacity-50"
            >
              {labels.approveComplete}
            </button>
          </>
        )}
      </div>

      {showCorrectionBox && (
        <div className="mt-4 rounded-lg border border-amber-200 bg-amber-50 p-4">
          <label className="mb-1 block text-xs font-medium text-amber-800">
            {labels.correctionNoteLabel}
          </label>
          <textarea
            className="w-full rounded-md border border-amber-300 px-3 py-2 text-sm"
            rows={3}
            value={correctionNote}
            onChange={(e) => setCorrectionNote(e.target.value)}
            placeholder={labels.correctionNotePlaceholder}
          />
          <div className="mt-3 flex justify-end gap-2">
            <button
              type="button"
              className="rounded-md px-3 py-1.5 text-sm text-slate-600 hover:bg-slate-100"
              onClick={() => setShowCorrectionBox(false)}
            >
              {labels.cancel}
            </button>
            <button
              type="button"
              disabled={isPending}
              onClick={handleRequestCorrection}
              className="rounded-md bg-amber-700 px-4 py-1.5 text-sm font-semibold text-white hover:bg-amber-800 disabled:opacity-50"
            >
              {labels.sendCorrection}
            </button>
          </div>
        </div>
      )}

      {confirmAction && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-lg">
            <h3 className="text-base font-semibold text-slate-900">
              {confirmAction === "submit" ? labels.submitOnBehalfConfirmTitle : labels.approveCompleteConfirmTitle}
            </h3>
            <p className="mt-2 text-sm text-slate-600">
              {confirmAction === "submit" ? labels.submitOnBehalfConfirmBody : labels.approveCompleteConfirmBody}
            </p>
            <div className="mt-5 flex justify-end gap-2">
              <button
                type="button"
                className="rounded-md px-3 py-1.5 text-sm text-slate-600 hover:bg-slate-100"
                onClick={() => setConfirmAction(null)}
              >
                {labels.cancel}
              </button>
              <button
                type="button"
                disabled={isPending}
                onClick={confirmAction === "submit" ? handleSubmitOnBehalf : handleApproveComplete}
                className="rounded-md bg-teal-700 px-4 py-1.5 text-sm font-semibold text-white hover:bg-teal-800 disabled:opacity-50"
              >
                {labels.confirm}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function HeaderField({
  label,
  value,
  onChange,
  onBlur,
}: {
  label: string
  value: string
  onChange: (v: string) => void
  onBlur: (v: string) => void
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-medium text-slate-600">{label}</span>
      <input
        className="w-full rounded-md border border-slate-200 px-3 py-2 text-sm"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onBlur={(e) => onBlur(e.target.value)}
      />
    </label>
  )
}
