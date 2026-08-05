'use client'

import { useState, useTransition } from "react"
import { useTranslations } from "next-intl"
import { saveShippingSettings } from "./actions"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Card, CardContent, CardFooter } from "@/components/ui/card"
import { Loader2 } from "lucide-react"

type Settings = {
  base_address_line1: string
  base_city: string
  base_state: string
  base_zip: string
  suite_number_enabled: boolean
} | null

export default function ShippingForm({ initialSettings }: { initialSettings: Settings }) {
  const t = useTranslations("shippingForm")
  const [isPending, startTransition] = useTransition()
  const [message, setMessage] = useState<string | null>(null)
  const [suiteEnabled, setSuiteEnabled] = useState(initialSettings?.suite_number_enabled ?? false)
  const [applyToExisting, setApplyToExisting] = useState(false)

  function handleSubmit(formData: FormData) {
    setMessage(null)
    formData.set("suite_number_enabled", suiteEnabled ? "true" : "false")
    formData.set("apply_to_existing", applyToExisting ? "true" : "false")
    startTransition(async () => {
      const result = await saveShippingSettings(formData)
      if (result?.error) {
        setMessage(result.error)
      } else {
        if (result?.updatedCount != null) {
          setMessage(t("savedWithCount", { count: result.updatedCount }))
        } else {
          setMessage(t("saved"))
        }
        setApplyToExisting(false)
      }
    })
  }

  return (
    <Card>
      <form action={handleSubmit}>
        <CardContent className="space-y-6 py-6">
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="base_address_line1">{t("addressLine1Label")}</Label>
              <Input
                id="base_address_line1"
                name="base_address_line1"
                defaultValue={initialSettings?.base_address_line1 ?? ""}
                required
              />
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <div className="space-y-2">
                <Label htmlFor="base_city">{t("cityLabel")}</Label>
                <Input id="base_city" name="base_city" defaultValue={initialSettings?.base_city ?? ""} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="base_state">{t("stateLabel")}</Label>
                <Input id="base_state" name="base_state" defaultValue={initialSettings?.base_state ?? ""} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="base_zip">{t("zipLabel")}</Label>
                <Input id="base_zip" name="base_zip" defaultValue={initialSettings?.base_zip ?? ""} required />
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between rounded-lg border p-4">
            <div className="space-y-0.5 pr-4">
              <Label htmlFor="suite_number_enabled">{t("suiteToggleLabel")}</Label>
              <p className="text-sm text-muted-foreground">{t("suiteToggleHint")}</p>
            </div>
            <Switch id="suite_number_enabled" checked={suiteEnabled} onCheckedChange={setSuiteEnabled} />
          </div>

          <div className="flex items-center justify-between rounded-lg border border-amber-200 bg-amber-50 p-4">
            <div className="space-y-0.5 pr-4">
              <Label htmlFor="apply_to_existing">{t("applyExistingLabel")}</Label>
              <p className="text-sm text-muted-foreground">{t("applyExistingHint")}</p>
            </div>
            <Switch id="apply_to_existing" checked={applyToExisting} onCheckedChange={setApplyToExisting} />
          </div>

          {message && <p className="text-sm text-slate-700">{message}</p>}
        </CardContent>
        <CardFooter>
          <Button type="submit" disabled={isPending} className="w-full">
            {isPending && <Loader2 className="h-4 w-4 animate-spin" />}
            {isPending ? t("saving") : t("save")}
          </Button>
        </CardFooter>
      </form>
    </Card>
  )
}
