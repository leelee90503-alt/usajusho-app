"use client"

import { useState, useTransition } from "react"
import { useTranslations } from "next-intl"
import { saveFeeSettings } from "./actions"

type FeeSettings = {
  flatFeeCents: number
  feePercent: number
}

export default function FeeSettingsForm({
  initialSettings,
}: {
  initialSettings: FeeSettings
}) {
  const t = useTranslations("adminPurchaseRequests")
  const [isPending, startTransition] = useTransition()
  const [message, setMessage] = useState<
    { type: "error" | "success"; text: string } | null
  >(null)
  const [current, setCurrent] = useState(initialSettings)

  function handleSubmit(formData: FormData) {
    setMessage(null)
    startTransition(async () => {
      const result = await saveFeeSettings(formData)
      if (result?.error) {
        setMessage({ type: "error", text: result.error })
        return
      }
      const flatFeeDollars = Number(formData.get("flat_fee_dollars") || "0")
      const feePercent = Number(formData.get("fee_percent") || "0")
      setCurrent({
        flatFeeCents: Math.round(flatFeeDollars * 100),
        feePercent,
      })
      setMessage({ type: "success", text: t("feeSettingsSaved") })
    })
  }

  return (
    <div className="mt-6 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
      <h2 className="text-sm font-semibold text-slate-900">
        {t("feeSettingsHeading")}
      </h2>
      <p className="mt-1 text-sm text-slate-500">
        {t("feeSettingsDescription")}
      </p>

      <form action={handleSubmit} className="mt-4 flex flex-wrap items-end gap-4">
        <div>
          <label className="block text-xs font-medium text-slate-600">
            {t("flatFeeField")}
          </label>
          <input
            type="number"
            name="flat_fee_dollars"
            step="0.01"
            min="0"
            required
            defaultValue={(current.flatFeeCents / 100).toFixed(2)}
            className="mt-1 w-36 rounded-lg border border-slate-300 px-3 py-2 text-sm"
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-slate-600">
            {t("feePercentField")}
          </label>
          <input
            type="number"
            name="fee_percent"
            step="0.01"
            min="0"
            required
            defaultValue={current.feePercent}
            className="mt-1 w-36 rounded-lg border border-slate-300 px-3 py-2 text-sm"
          />
        </div>

        <button
          type="submit"
          disabled={isPending}
          className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800 disabled:opacity-50"
        >
          {isPending ? t("feeSettingsSaving") : t("feeSettingsSave")}
        </button>
      </form>

      {message && (
        <p
          className={
            message.type === "error" ? "mt-3 text-sm text-red-600" : "mt-3 text-sm text-teal-700"
          }
        >
          {message.text}
        </p>
      )}

      <p className="mt-4 text-xs text-slate-400">
        {t("feeSettingsCurrent", {
          flatFee: (current.flatFeeCents / 100).toFixed(2),
          feePercent: current.feePercent,
        })}
      </p>
    </div>
  )
}
