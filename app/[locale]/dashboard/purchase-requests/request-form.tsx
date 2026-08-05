"use client"

import { useRef, useState, useTransition } from "react"
import { useTranslations } from "next-intl"
import { submitPurchaseRequest } from "./actions"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"

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
    <form ref={formRef} action={handleSubmit} className="space-y-4">
      <div className="space-y-1.5">
        <Label htmlFor="product_url">{t("productUrlLabel")}</Label>
        <Input
          id="product_url"
          type="url"
          name="product_url"
          placeholder="https://www.amazon.com/..."
        />
        <p className="text-xs text-muted-foreground">{t("productUrlNote")}</p>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="product_description">{t("productDescriptionLabel")}</Label>
        <Textarea
          id="product_description"
          name="product_description"
          required
          rows={4}
          placeholder={t("productDescriptionPlaceholder")}
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="budget_cap">{t("budgetCapLabel")}</Label>
        <Input
          id="budget_cap"
          type="number"
          name="budget_cap"
          min="0"
          step="0.01"
          placeholder="150.00"
          className="max-w-[200px]"
        />
      </div>

      {message && (
        <p className="text-sm text-primary" role="status">
          {message}
        </p>
      )}

      <Button type="submit" disabled={isPending}>
        {isPending ? t("submitting") : t("submitButton")}
      </Button>
    </form>
  )
}
