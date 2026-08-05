"use client"

import { useState, useTransition } from "react"
import { useTranslations } from "next-intl"
import { deleteRate, toggleRateActive, updateRate } from "./actions"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent } from "@/components/ui/card"

type Rate = {
  id: string
  label: string
  min_weight_kg: number
  max_weight_kg: number | null
  price_per_kg: number
  min_charge: number
  is_active: boolean
}

export default function RateRow({ rate }: { rate: Rate }) {
  const t = useTranslations("adminPricing")
  const [isEditing, setIsEditing] = useState(false)
  const [isPending, startTransition] = useTransition()
  const [message, setMessage] = useState<string | null>(null)

  function handleUpdate(formData: FormData) {
    setMessage(null)
    startTransition(async () => {
      const result = await updateRate(rate.id, formData)
      if (result?.error) {
        setMessage(result.error)
      } else {
        setIsEditing(false)
      }
    })
  }

  function handleToggle() {
    startTransition(async () => {
      await toggleRateActive(rate.id, !rate.is_active)
    })
  }

  function handleDelete() {
    const ok = confirm(t("deleteConfirm", { label: rate.label }))
    if (!ok) return
    startTransition(async () => {
      await deleteRate(rate.id)
    })
  }

  if (isEditing) {
    return (
      <Card className="border-teal-200 bg-teal-50">
        <CardContent className="py-4">
          <form action={handleUpdate} className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="space-y-1 sm:col-span-2">
              <Label className="text-xs font-normal text-teal-800">{t("labelField")}</Label>
              <Input name="label" defaultValue={rate.label} required />
            </div>
            <div className="space-y-1">
              <Label className="text-xs font-normal text-teal-800">{t("minWeightField")}</Label>
              <Input
                type="number"
                name="min_weight_kg"
                step="0.01"
                min="0"
                defaultValue={rate.min_weight_kg}
                required
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs font-normal text-teal-800">{t("maxWeightField")}</Label>
              <Input
                type="number"
                name="max_weight_kg"
                step="0.01"
                min="0"
                defaultValue={rate.max_weight_kg ?? ""}
                placeholder={t("maxWeightPlaceholder")}
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs font-normal text-teal-800">{t("pricePerKgField")}</Label>
              <Input
                type="number"
                name="price_per_kg"
                step="1"
                min="0"
                defaultValue={rate.price_per_kg}
                required
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs font-normal text-teal-800">{t("minChargeField")}</Label>
              <Input type="number" name="min_charge" step="1" min="0" defaultValue={rate.min_charge} />
            </div>

            {message && <p className="text-xs text-destructive sm:col-span-2">{message}</p>}

            <div className="flex gap-2 sm:col-span-2">
              <Button type="submit" size="sm" disabled={isPending}>
                {t("save")}
              </Button>
              <Button type="button" variant="outline" size="sm" onClick={() => setIsEditing(false)}>
                {t("cancel")}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    )
  }

  const maxLabel = rate.max_weight_kg === null ? t("andAbove") : String(rate.max_weight_kg)

  return (
    <Card className={rate.is_active ? undefined : "bg-muted/60 opacity-60"}>
      <CardContent className="flex flex-wrap items-center justify-between gap-3 py-4">
        <div>
          <p className="text-sm font-semibold text-foreground">{rate.label}</p>
          <p className="mt-1 text-xs text-muted-foreground">
            {t("rangeLabel", {
              min: rate.min_weight_kg,
              max: maxLabel,
            })}
            {" - "}
            {t("priceLabel", { price: rate.price_per_kg })}
            {rate.min_charge > 0 && (
              <>
                {" - "}
                {t("minChargeLabel", { amount: rate.min_charge })}
              </>
            )}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handleToggle} disabled={isPending}>
            {rate.is_active ? t("deactivate") : t("activate")}
          </Button>
          <Button variant="outline" size="sm" onClick={() => setIsEditing(true)}>
            {t("edit")}
          </Button>
          <Button variant="destructive" size="sm" onClick={handleDelete} disabled={isPending}>
            {t("delete")}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
