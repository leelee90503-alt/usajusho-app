"use client"

import { useState, useTransition } from "react"
import { useTranslations } from "next-intl"
import { createCheckoutSession } from "../actions"

export default function PayButton({ requestId }: { requestId: string }) {
  const t = useTranslations("purchaseRequests")
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  function handlePay() {
    setError(null)
    startTransition(async () => {
      const result = await createCheckoutSession(requestId)
      if (result?.error) {
        setError(result.error)
      } else if (result?.url) {
        window.location.href = result.url
      }
    })
  }

  return (
    <div>
      <button
        type="button"
        onClick={handlePay}
        disabled={isPending}
        className="rounded-md bg-[var(--usj-primary)] px-5 py-2.5 text-sm font-semibold text-white hover:opacity-90 disabled:opacity-50"
      >
        {isPending ? t("payButtonPending") : t("payButton")}
      </button>
      {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
    </div>
  )
}
