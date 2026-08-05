"use client"

import { useState, useTransition } from "react"
import { useTranslations } from "next-intl"
import { useRouter } from "@/i18n/navigation"
import { cancelPurchaseRequest } from "../actions"

export default function CancelButton({ requestId }: { requestId: string }) {
  const t = useTranslations("purchaseRequests")
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  function handleCancel() {
    const ok = confirm(t("cancelConfirm"))
    if (!ok) return
    setError(null)
    startTransition(async () => {
      const result = await cancelPurchaseRequest(requestId)
      if (result?.error) {
        setError(result.error)
      } else {
        router.refresh()
      }
    })
  }

  return (
    <div>
      <button
        type="button"
        onClick={handleCancel}
        disabled={isPending}
        className="rounded-md border border-slate-300 px-5 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
      >
        {isPending ? t("cancelButtonPending") : t("cancelButton")}
      </button>
      {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
    </div>
  )
}
