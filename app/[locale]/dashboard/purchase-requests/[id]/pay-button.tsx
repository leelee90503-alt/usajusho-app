"use client"

import { useState, useTransition } from "react"
import { useTranslations } from "next-intl"
import { createCheckoutSession } from "../actions"
import { Button } from "@/components/ui/button"
import { Loader2 } from "lucide-react"

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
      <Button type="button" onClick={handlePay} disabled={isPending}>
        {isPending && <Loader2 className="h-4 w-4 animate-spin" />}
        {isPending ? t("payButtonPending") : t("payButton")}
      </Button>
      {error && <p className="mt-2 text-sm text-destructive">{error}</p>}
    </div>
  )
}
