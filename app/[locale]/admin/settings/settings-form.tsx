'use client'

import { useState, useTransition } from "react"
import { useTranslations } from "next-intl"
import { saveEmailSettings } from "./actions"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardFooter } from "@/components/ui/card"
import { Loader2 } from "lucide-react"

type Settings = {
  resend_api_key: string | null
} | null

export default function SettingsForm({ initialSettings }: { initialSettings: Settings }) {
  const t = useTranslations("settingsForm")
  const [isPending, startTransition] = useTransition()
  const [message, setMessage] = useState<string | null>(null)
  const [configured, setConfigured] = useState(!!initialSettings?.resend_api_key)

  function handleSubmit(formData: FormData) {
    setMessage(null)
    startTransition(async () => {
      const result = await saveEmailSettings(formData)
      if (result?.error) {
        setMessage(result.error)
      } else {
        setMessage(t("saved"))
        setConfigured(!!String(formData.get("resend_api_key") || "").trim())
      }
    })
  }

  return (
    <Card>
      <form action={handleSubmit}>
        <CardContent className="space-y-4 py-6">
          <div className="mb-2 flex items-center gap-2">
            <span
              className={
                "inline-block h-2 w-2 rounded-full " + (configured ? "bg-emerald-500" : "bg-slate-300")
              }
            />
            <span className="text-sm text-muted-foreground">
              {configured ? t("statusConfigured") : t("statusUnconfigured")}
            </span>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="resend_api_key">{t("apiKeyLabel")}</Label>
            <Input
              id="resend_api_key"
              type="password"
              name="resend_api_key"
              defaultValue={initialSettings?.resend_api_key ?? ""}
            />
            <p className="text-xs text-muted-foreground">
              {t("apiKeyHint")}
            </p>
          </div>

          {message && <p className="text-sm text-accent">{message}</p>}
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
