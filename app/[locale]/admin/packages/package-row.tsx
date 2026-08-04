"use client"

import { useState, useTransition } from "react"
import { updatePackageStatus, deletePackage, submitQuote } from "./actions"

const STATUS_OPTIONS = [
  { value: "arrived", label: "到着済み" },
  { value: "requested", label: "発送依頼済み" },
  { value: "quoted", label: "見積済み" },
  { value: "paid", label: "支払い済み" },
  { value: "shipped", label: "発送完了" },
]

export default function PackageRow({ pkg }: { pkg: any }) {
  const [isPending, startTransition] = useTransition()
  const [quoteAmount, setQuoteAmount] = useState("")
  const [quoteNote, setQuoteNote] = useState("")
  const [quoteMessage, setQuoteMessage] = useState<string | null>(null)

  function handleStatusChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const status = e.target.value
    startTransition(() => {
      updatePackageStatus(pkg.id, status)
    })
  }

  function handleDelete() {
    const ok = confirm(pkg.item_name + " を削除しますか？")
    if (!ok) return
    startTransition(() => {
      deletePackage(pkg.id)
    })
  }

  function handleSubmitQuote() {
    const amount = Number(quoteAmount)
    if (!amount || amount <= 0) {
      setQuoteMessage("正しい金額を入力してください。")
      return
    }
    setQuoteMessage(null)
    startTransition(async () => {
      const result = await submitQuote(pkg.id, amount, quoteNote)
      if (result?.error) {
        setQuoteMessage(result.error)
      } else {
        setQuoteMessage("見積を送信しました。")
      }
    })
  }

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="font-semibold text-slate-900">{pkg.item_name}</p>
          <p className="mt-1 text-xs text-slate-500">
            {pkg.profiles?.full_name} ・ {pkg.profiles?.suite_number}
          </p>
          {pkg.tracking_number && (
            <p className="mt-1 text-xs text-slate-500">追跡番号: {pkg.tracking_number}</p>
          )}
          {pkg.weight_lbs && (
            <p className="mt-1 text-xs text-slate-500">重量: {pkg.weight_lbs} lbs</p>
          )}
          {pkg.admin_note && (
            <p className="mt-2 text-xs text-slate-600">{pkg.admin_note}</p>
          )}
          {pkg.quote_amount != null && (
            <p className="mt-2 text-xs font-semibold text-teal-700">
              見積金額: ￥{Number(pkg.quote_amount).toLocaleString()}
              {pkg.quote_note && (
                <span className="ml-1 font-normal text-slate-500">({pkg.quote_note})</span>
              )}
            </p>
          )}
        </div>

        <div className="flex items-center gap-2">
          <select
            value={pkg.status}
            onChange={handleStatusChange}
            disabled={isPending}
            className="rounded-lg border border-slate-300 px-2 py-1 text-xs"
          >
            {STATUS_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>

          <button
            onClick={handleDelete}
            disabled={isPending}
            className="rounded-lg border border-red-200 px-2 py-1 text-xs text-red-600 hover:bg-red-50"
          >
            削除
          </button>
        </div>
      </div>

      {pkg.status === "requested" && (
        <div className="mt-3 flex flex-wrap items-end gap-2 rounded-lg border border-teal-200 bg-teal-50 p-3">
          <div>
            <label className="block text-xs text-teal-800">見積金額 (円)</label>
            <input
              type="number"
              value={quoteAmount}
              onChange={(e) => setQuoteAmount(e.target.value)}
              className="mt-1 w-32 rounded-lg border border-slate-300 px-2 py-1 text-sm"
              placeholder="3000"
            />
          </div>
          <div className="flex-1">
            <label className="block text-xs text-teal-800">メモ (任意)</label>
            <input
              type="text"
              value={quoteNote}
              onChange={(e) => setQuoteNote(e.target.value)}
              className="mt-1 w-full rounded-lg border border-slate-300 px-2 py-1 text-sm"
            />
          </div>
          <button
            onClick={handleSubmitQuote}
            disabled={isPending}
            className="whitespace-nowrap rounded-lg bg-teal-700 px-3 py-1.5 text-xs font-semibold text-white hover:bg-teal-800 disabled:opacity-50"
          >
            見積を送信
          </button>
          {quoteMessage && <p className="w-full text-xs text-teal-800">{quoteMessage}</p>}
        </div>
      )}
    </div>
  )
}
