"use client"

import { useState, useTransition } from "react"
import { useTranslations } from "next-intl"
import { deleteRate, toggleRateActive, updateRate } from "./actions"

type Rate = {
  id: string
  label: string
  min_weight_kg: number
  max_weight_kg: number | null
  price_per_kg: number
  min_charge: number
  is_active: boolean
}

export default function RateRow({ rate }: { rate: Rate }) {
  const t = useTranslations("adminPricing")
  const [isEditing, setIsEditing] = useState(false)
  const [isPending, startTransition] = useTransition()
  const [message, setMessage] = useState<string | null>(null)

  function handleUpdate(formData: FormData) {
    setMessage(null)
    startTransition(async () => {
      const result = await updateRate(rate.id, formData)
      if (result?.error) {
        setMessage(result.error)
      } else {
        setIsEditing(false)
      }
    })
  }

  function handleToggle() {
    startTransition(async () => {
      await toggleRateActive(rate.id, !rate.is_active)
    })
  }

  function handleDelete() {
    const ok = confirm(t("deleteConfirm", { label: rate.label }))
    if (!ok) return
    startTransition(async () => {
      await deleteRate(rate.id)
    })
  }

  if (isEditing) {
    return (
      <div className="rounded-xl border border-teal-200 bg-teal-50 p-4">
        <form action={handleUpdate} className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <label className="block text-xs text-teal-800">{t("labelField")}</label>
            <input
              name="label"
              defaultValue={rate.label}
              required
              className="mt-1 w-full rounded-lg border border-slate-300 px-2 py-1 text-sm"
            />
          </div>
          <div>
            <label className="block text-xs text-teal-800">{t("minWeightField")}</label>
            <input
              type="number"
              name="min_weight_kg"
              step="0.01"
              min="0"
              defaultValue={rate.min_weight_kg}
              required
              className="mt-1 w-full rounded-lg border border-slate-300 px-2 py-1 text-sm"
            />
          </div>
          <div>
            <label className="block text-xs text-teal-800">{t("maxWeightField")}</label>
            <input
              type="number"
              name="max_weight_kg"
              step="0.01"
              min="0"
              defaultValue={rate.max_weight_kg ?? ""}
              placeholder={t("maxWeightPlaceholder")}
              className="mt-1 w-full rounded-lg border border-slate-300 px-2 py-1 text-sm"
            />
          </div>
          <div>
            <label className="block text-xs text-teal-800">{t("pricePerKgField")}</label>
            <input
              type="number"
              name="price_per_kg"
              step="1"
              min="0"
              defaultValue={rate.price_per_kg}
              required
              className="mt-1 w-full rounded-lg border border-slate-300 px-2 py-1 text-sm"
            />
          </div>
          <div>
            <label className="block text-xs text-teal-800">{t("minChargeField")}</label>
            <input
              type="number"
              name="min_charge"
              step="1"
              min="0"
              defaultValue={rate.min_charge}
              className="mt-1 w-full rounded-lg border border-slate-300 px-2 py-1 text-sm"
            />
          </div>

          {message && <p className="sm:col-span-2 text-xs text-red-600">{message}</p>}

          <div className="sm:col-span-2 flex gap-2">
            <button
              type="submit"
              disabled={isPending}
              className="rounded-lg bg-teal-700 px-3 py-1.5 text-xs font-semibold text-white disabled:opacity-50"
            >
              {t("save")}
            </button>
            <button
              type="button"
              onClick={() => setIsEditing(false)}
              className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-semibold text-slate-700"
            >
              {t("cancel")}
            </button>
          </div>
        </form>
      </div>
    )
  }

  const maxLabel = rate.max_weight_kg === null ? t("andAbove") : String(rate.max_weight_kg)

  return (
    <div
      className={`flex flex-wrap items-center justify-between gap-3 rounded-xl border p-4 ${
        rate.is_active ? "border-slate-200 bg-white" : "border-slate-200 bg-slate-100 opacity-60"
      }`}
    >
      <div>
        <p className="text-sm font-semibold text-slate-900">{rate.label}</p>
        <p className="mt-1 text-xs text-slate-500">
          {t("rangeLabel", {
            min: rate.min_weight_kg,
            max: maxLabel,
          })}
          {" - "}
          {t("priceLabel", { price: rate.price_per_kg })}
          {rate.min_charge > 0 && (
            <>
              {" - "}
              {t("minChargeLabel", { amount: rate.min_charge })}
            </>
          )}
        </p>
      </div>

      <div className="flex items-center gap-2">
        <button
          onClick={handleToggle}
          disabled={isPending}
          className="whitespace-nowrap rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-semibold text-slate-700 disabled:opacity-50"
        >
          {rate.is_active ? t("deactivate") : t("activate")}
        </button>
        <button
          onClick={() => setIsEditing(true)}
          className="whitespace-nowrap rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-semibold text-slate-700"
        >
          {t("edit")}
        </button>
        <button
          onClick={handleDelete}
          disabled={isPending}
          className="whitespace-nowrap rounded-lg border border-red-300 px-3 py-1.5 text-xs font-semibold text-red-700 disabled:opacity-50"
        >
          {t("delete")}
        </button>
      </div>
    </div>
  )
}
