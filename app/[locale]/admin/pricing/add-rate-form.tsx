"use client"

import { useRef, useState, useTransition } from "react"
import { useTranslations } from "next-intl"
import { createRate } from "./actions"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Loader2 } from "lucide-react"

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
    <form ref={formRef} action={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="space-y-1.5 sm:col-span-2">
          <Label htmlFor="rate-label">{t("labelField")}</Label>
          <Input id="rate-label" name="label" required placeholder={t("labelPlaceholder")} />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="rate-min-weight">{t("minWeightField")}</Label>
          <Input id="rate-min-weight" type="number" name="min_weight_kg" step="0.01" min="0" required />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="rate-max-weight">{t("maxWeightField")}</Label>
          <Input
            id="rate-max-weight"
            type="number"
            name="max_weight_kg"
            step="0.01"
            min="0"
            placeholder={t("maxWeightPlaceholder")}
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="rate-price">{t("pricePerKgField")}</Label>
          <Input id="rate-price" type="number" name="price_per_kg" step="1" min="0" required />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="rate-min-charge">{t("minChargeField")}</Label>
          <Input id="rate-min-charge" type="number" name="min_charge" step="1" min="0" defaultValue={0} />
        </div>
      </div>

      {message && (
        <p className={message.type === "error" ? "text-sm text-destructive" : "text-sm text-accent"}>
          {message.text}
        </p>
      )}

      <Button type="submit" disabled={isPending}>
        {isPending && <Loader2 className="h-4 w-4 animate-spin" />}
        {isPending ? t("submitting") : t("addSubmit")}
      </Button>
    </form>
  )
}
