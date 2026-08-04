'use client'

import { useRef, useState, useTransition } from "react"
import { useTranslations } from "next-intl"
import { addPackage } from "./actions"

export default function AddPackageForm() {
  const t = useTranslations("addPackageForm")
  const formRef = useRef<HTMLFormElement>(null)
  const [isPending, startTransition] = useTransition()
  const [message, setMessage] = useState<{ type: "error" | "success"; text: string } | null>(null)

  function handleSubmit(formData: FormData) {
    setMessage(null)
    startTransition(async () => {
      const result = await addPackage(formData)
      if (result?.error) {
        setMessage({ type: "error", text: result.error })
      } else {
        setMessage({ type: "success", text: t("success") })
        formRef.current?.reset()
      }
    })
  }

  return (
    <form
      ref={formRef}
      action={handleSubmit}
      className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm"
    >
      <h2 className="text-sm font-semibold text-slate-900">{t("heading")}</h2>

      <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label className="block text-xs font-medium text-slate-600">
            {t("suiteLabel")}
          </label>
          <input
            name="suite_number"
            required
            className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-slate-600">{t("itemNameLabel")}</label>
          <input
            name="item_name"
            required
            className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-slate-600">{t("trackingNumberLabel")}</label>
          <input
            name="tracking_number"
            className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-slate-600">{t("weightLabel")}</label>
          <input
            name="weight_kg"
            type="number"
            step="0.01"
            className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-slate-600">{t("lengthLabel")}</label>
          <input
            name="length_cm"
            type="number"
            step="0.1"
            className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-slate-600">{t("widthLabel")}</label>
          <input
            name="width_cm"
            type="number"
            step="0.1"
            className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-slate-600">{t("heightLabel")}</label>
          <input
            name="height_cm"
            type="number"
            step="0.1"
            className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
          />
        </div>

        <div className="sm:col-span-2">
          <label className="block text-xs font-medium text-slate-600">{t("adminNoteLabel")}</label>
          <textarea
            name="admin_note"
            rows={2}
            className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
          />
        </div>
      </div>

      {message && (
        <p
          className={
            message.type === "error" ? "mt-3 text-sm text-red-600" : "mt-3 text-sm text-teal-700"
          }
        >
          {message.text}
        </p>
      )}

      <button
        type="submit"
        disabled={isPending}
        className="mt-4 rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
      >
        {isPending ? t("submitting") : t("submit")}
      </button>
    </form>
  )
}
