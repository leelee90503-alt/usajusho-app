"use client"

import { useRef, useState, useTransition } from "react"
import { useTranslations } from "next-intl"
import { createRate } from "./actions"

export default function AddRateForm() {
  const t = useTranslations("adminPricing")
  const formRef = useRef<HTMLFormElement>(null)
  const [isPending, startTransition] = useTransition()
  const [message, setMessage] = useState<{ type: "error" | "success"; text: string } | null>(
    null,
  )

  function handleSubmit(formData: FormData) {
    setMessage(null)
    startTransition(async () => {
      const result = await createRate(formData)
      if (result?.error) {
        setMessage({ type: "error", text: result.error })
      } else {
        setMessage({ type: "success", text: t("addSuccess") })
        formRef.current?.reset()
      }
    })
  }

  return (
    <form ref={formRef} action={handleSubmit} className="mt-4 space-y-4">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <label className="block text-xs font-medium text-slate-600">{t("labelField")}</label>
          <input
            name="label"
            required
            placeholder={t("labelPlaceholder")}
            className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-slate-600">{t("minWeightField")}</label>
          <input
            type="number"
            name="min_weight_kg"
            step="0.01"
            min="0"
            required
            className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-slate-600">{t("maxWeightField")}</label>
          <input
            type="number"
            name="max_weight_kg"
            step="0.01"
            min="0"
            placeholder={t("maxWeightPlaceholder")}
            className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-slate-600">{t("pricePerKgField")}</label>
          <input
            type="number"
            name="price_per_kg"
            step="1"
            min="0"
            required
            className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-slate-600">{t("minChargeField")}</label>
          <input
            type="number"
            name="min_charge"
            step="1"
            min="0"
            defaultValue={0}
            className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
          />
        </div>
      </div>

      {message && (
        <p
          className={
            message.type === "error" ? "text-sm text-red-600" : "text-sm text-teal-700"
          }
        >
          {message.text}
        </p>
      )}

      <button
        type="submit"
        disabled={isPending}
        className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
      >
        {isPending ? t("submitting") : t("addSubmit")}
      </button>
    </form>
  )
}
