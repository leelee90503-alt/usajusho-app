"use client"

import { useState, useTransition } from "react"
import { useTranslations } from "next-intl"
import { saveFeeSettings } from "./actions"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Loader2 } from "lucide-react"

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
    <Card className="mt-6">
      <CardHeader>
        <CardTitle>{t("feeSettingsHeading")}</CardTitle>
        <CardDescription>{t("feeSettingsDescription")}</CardDescription>
      </CardHeader>

      <form action={handleSubmit}>
        <CardContent className="flex flex-wrap items-end gap-4">
          <div className="space-y-1.5">
            <Label htmlFor="flat_fee_dollars">{t("flatFeeField")}</Label>
            <Input
              id="flat_fee_dollars"
              type="number"
              name="flat_fee_dollars"
              step="0.01"
              min="0"
              required
              defaultValue={(current.flatFeeCents / 100).toFixed(2)}
              className="w-36"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="fee_percent">{t("feePercentField")}</Label>
            <Input
              id="fee_percent"
              type="number"
              name="fee_percent"
              step="0.01"
              min="0"
              required
              defaultValue={current.feePercent}
              className="w-36"
            />
          </div>

          <Button type="submit" disabled={isPending}>
            {isPending && <Loader2 className="h-4 w-4 animate-spin" />}
            {isPending ? t("feeSettingsSaving") : t("feeSettingsSave")}
          </Button>
        </CardContent>
      </form>

      <CardFooter className="flex-col items-start gap-2">
        {message && (
          <p
            className={
              message.type === "error"
                ? "text-sm text-destructive"
                : "text-sm text-accent"
            }
          >
            {message.text}
          </p>
        )}
        <p className="text-xs text-muted-foreground">
          {t("feeSettingsCurrent", {
            flatFee: (current.flatFeeCents / 100).toFixed(2),
            feePercent: current.feePercent,
          })}
        </p>
      </CardFooter>
    </Card>
  )
}
