"use client"

import { useState, useTransition } from "react"
import { requestShipment, payForShipment } from "./actions"

const STATUS_LABELS: Record<string, string> = {
  arrived: "到着済み",
  requested: "発送依頼済み",
  quoted: "見積済み",
  paid: "支払い済み",
  shipped: "発送完了",
}

type Package = {
  id: string
  item_name: string
  tracking_number: string | null
  weight_lbs: number | null
  admin_note: string | null
  status: string
  quote_amount: number | null
  quote_note: string | null
}

export default function PackageList({ packages }: { packages: Package[] }) {
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [isPending, startTransition] = useTransition()
  const [message, setMessage] = useState<string | null>(null)
  const [payingId, setPayingId] = useState<string | null>(null)
  const [payMessage, setPayMessage] = useState<string | null>(null)

  const arrivedPackages = packages.filter((p) => p.status === "arrived")

  function toggleSelected(id: string) {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
      } else {
        next.add(id)
      }
      return next
    })
  }

  function handleRequestShipment() {
    setMessage(null)
    startTransition(async () => {
      const result = await requestShipment(Array.from(selected))
      if (result?.error) {
        setMessage(result.error)
      } else {
        setMessage("発送を依頼しました。")
        setSelected(new Set())
      }
    })
  }

  function handlePay(id: string) {
    setPayMessage(null)
    setPayingId(id)
    startTransition(async () => {
      const result = await payForShipment(id)
      if (result?.error) {
        setPayMessage(result.error)
      } else {
        setPayMessage("お支払いが完了しました。")
      }
      setPayingId(null)
    })
  }

  if (!packages || packages.length === 0) {
    return (
      <div className="mt-3 rounded-xl border border-dashed border-slate-300 bg-white p-8 text-center text-sm text-slate-500">
        まだ届いた荷物はありません。
        <br />
        上記の米国住所宛に商品を発送すると、ここに表示されます。
      </div>
    )
  }

  return (
    <div className="mt-3 space-y-3">
      {arrivedPackages.length > 0 && (
        <div className="flex items-center justify-between rounded-xl border border-teal-200 bg-teal-50 p-4">
          <p className="text-sm text-teal-800">
            発送したい荷物にチェックを入れて、依頼してください。
          </p>
          <button
            onClick={handleRequestShipment}
            disabled={isPending || selected.size === 0}
            className="whitespace-nowrap rounded-lg bg-teal-700 px-4 py-2 text-sm font-semibold text-white hover:bg-teal-800 disabled:opacity-50"
          >
            発送を依頼する（{selected.size}）
          </button>
        </div>
      )}

      {message && <p className="text-sm text-teal-700">{message}</p>}
      {payMessage && <p className="text-sm text-teal-700">{payMessage}</p>}

      <ul className="space-y-3">
        {packages.map((pkg) => (
          <li
            key={pkg.id}
            className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm"
          >
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-start gap-3">
                {pkg.status === "arrived" && (
                  <input
                    type="checkbox"
                    checked={selected.has(pkg.id)}
                    onChange={() => toggleSelected(pkg.id)}
                    className="mt-1 h-4 w-4"
                  />
                )}
                <div>
                  <p className="font-semibold text-slate-900">{pkg.item_name}</p>
                  {pkg.tracking_number && (
                    <p className="mt-1 text-xs text-slate-500">
                      追跡番号: {pkg.tracking_number}
                    </p>
                  )}
                  {pkg.weight_lbs && (
                    <p className="mt-1 text-xs text-slate-500">
                      重量: {pkg.weight_lbs} lbs
                    </p>
                  )}
                  {pkg.admin_note && (
                    <p className="mt-2 text-xs text-slate-600">{pkg.admin_note}</p>
                  )}
                </div>
              </div>
              <span className="whitespace-nowrap rounded-full bg-teal-50 px-3 py-1 text-xs font-semibold text-teal-700">
                {STATUS_LABELS[pkg.status] || pkg.status}
              </span>
            </div>

            {pkg.status === "quoted" && pkg.quote_amount != null && (
              <div className="mt-3 flex flex-wrap items-center justify-between gap-2 rounded-lg border border-amber-200 bg-amber-50 p-3">
                <div>
                  <p className="text-sm font-semibold text-amber-900">
                    送料の見積り: ￥{Number(pkg.quote_amount).toLocaleString()}
                  </p>
                  {pkg.quote_note && (
                    <p className="mt-1 text-xs text-amber-700">{pkg.quote_note}</p>
                  )}
                </div>
                <button
                  onClick={() => handlePay(pkg.id)}
                  disabled={isPending && payingId === pkg.id}
                  className="whitespace-nowrap rounded-lg bg-amber-600 px-4 py-2 text-sm font-semibold text-white hover:bg-amber-700 disabled:opacity-50"
                >
                  支払う
                </button>
              </div>
            )}
          </li>
        ))}
      </ul>
    </div>
  )
}
