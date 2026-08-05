"use client"

import { useRef, useState, useTransition } from "react"
import { useTranslations } from "next-intl"
import { submitPurchaseRequest } from "./actions"

export default function RequestForm() {
  const t = useTranslations("purchaseRequests")
  const formRef = useRef<HTMLFormElement>(null)
  const [isPending, startTransition] = useTransition()
  const [message, setMessage] = useState<string | null>(null)

  function handleSubmit(formData: FormData) {
    setMessage(null)
    startTransition(async () => {
      const result = await submitPurchaseRequest(formData)
      if (result?.error) {
        setMessage(result.error)
      } else {
        setMessage(t("submitSuccess"))
        formRef.current?.reset()
      }
    })
  }

  return (
    <form ref={formRef} action={handleSubmit} className="mt-4 space-y-4">
      <div>
        <label className="block text-sm font-medium text-slate-700">
          {t("productUrlLabel")}
        </label>
        <input
          type="url"
          name="product_url"
          placeholder="https://www.amazon.com/..."
          className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
        />
        <p className="mt-1 text-xs text-slate-400">{t("productUrlNote")}</p>
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700">
          {t("productDescriptionLabel")}
        </label>
        <textarea
          name="product_description"
          required
          rows={4}
          placeholder={t("productDescriptionPlaceholder")}
          className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700">
          {t("budgetCapLabel")}
        </label>
        <input
          type="number"
          name="budget_cap"
          min="0"
          step="0.01"
          placeholder="150.00"
          className="mt-1 w-full max-w-[200px] rounded-lg border border-slate-300 px-3 py-2 text-sm"
        />
      </div>

      {message && (
        <p className="text-sm text-teal-700" role="status">
          {message}
        </p>
      )}

      <button
        type="submit"
        disabled={isPending}
        className="rounded-md bg-[var(--usj-primary)] px-5 py-2.5 text-sm font-semibold text-white hover:opacity-90 disabled:opacity-50"
      >
        {isPending ? t("submitting") : t("submitButton")}
      </button>
    </form>
  )
}
