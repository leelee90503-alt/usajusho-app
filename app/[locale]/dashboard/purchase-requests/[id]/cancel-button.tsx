"use client"

import { useState, useTransition } from "react"
import { useTranslations } from "next-intl"
import { useRouter } from "@/i18n/navigation"
import { cancelPurchaseRequest } from "../actions"
import { Button } from "@/components/ui/button"
import { Loader2 } from "lucide-react"

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
      <Button type="button" variant="outline" onClick={handleCancel} disabled={isPending}>
        {isPending && <Loader2 className="h-4 w-4 animate-spin" />}
        {isPending ? t("cancelButtonPending") : t("cancelButton")}
      </Button>
      {error && <p className="mt-2 text-sm text-destructive">{error}</p>}
    </div>
  )
}
