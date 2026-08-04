"use client"

import { useTransition } from "react"
import { updatePackageStatus, deletePackage } from "./actions"

const STATUS_OPTIONS = [
  { value: "arrived", label: "到着済み" },
  { value: "requested", label: "発送依頼済み" },
  { value: "shipped", label: "発送完了" },
]

export default function PackageRow({ pkg }: { pkg: any }) {
  const [isPending, startTransition] = useTransition()

  function handleStatusChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const status = e.target.value
    startTransition(() => {
      updatePackageStatus(pkg.id, status)
    })
  }

  function handleDelete() {
    if (!confirm(`「${pkg.item_name}」を削除しますか？`)) return
    startTransition(() => {
      deletePackage(pkg.id)
    })
  }

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="font-semibold text-slate-900">{pkg.item_name}</p>
          <p className="mt-1 text-xs text-slate-500">
            {pkg.profiles?.full_name} · {pkg.profiles?.suite_number}
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
    </div>
  )
}
