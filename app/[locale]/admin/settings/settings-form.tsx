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
  emailjs_service_id: string | null
  emailjs_template_id: string | null
  emailjs_public_key: string | null
  emailjs_private_key: string | null
} | null

export default function SettingsForm({ initialSettings }: { initialSettings: Settings }) {
  const t = useTranslations("settingsForm")
  const [isPending, startTransition] = useTransition()
  const [message, setMessage] = useState<string | null>(null)
  const [configured, setConfigured] = useState(
    !!initialSettings?.emailjs_service_id &&
      !!initialSettings?.emailjs_template_id &&
      !!initialSettings?.emailjs_public_key
  )

  function handleSubmit(formData: FormData) {
    setMessage(null)
    startTransition(async () => {
      const result = await saveEmailSettings(formData)
      if (result?.error) {
        setMessage(result.error)
      } else {
        setMessage(t("saved"))
        setConfigured(
          !!(String(formData.get("emailjs_service_id") || "")).trim() &&
            !!(String(formData.get("emailjs_template_id") || "")).trim() &&
            !!(String(formData.get("emailjs_public_key") || "")).trim()
        )
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
            <Label htmlFor="emailjs_service_id">{t("serviceIdLabel")}</Label>
            <Input
              id="emailjs_service_id"
              type="text"
              name="emailjs_service_id"
              defaultValue={initialSettings?.emailjs_service_id ?? ""}
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="emailjs_template_id">{t("templateIdLabel")}</Label>
            <Input
              id="emailjs_template_id"
              type="text"
              name="emailjs_template_id"
              defaultValue={initialSettings?.emailjs_template_id ?? ""}
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="emailjs_public_key">{t("publicKeyLabel")}</Label>
            <Input
              id="emailjs_public_key"
              type="text"
              name="emailjs_public_key"
              defaultValue={initialSettings?.emailjs_public_key ?? ""}
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="emailjs_private_key">{t("privateKeyLabel")}</Label>
            <Input
              id="emailjs_private_key"
              type="password"
              name="emailjs_private_key"
              defaultValue={initialSettings?.emailjs_private_key ?? ""}
            />
            <p className="text-xs text-muted-foreground">
              {t("privateKeyHint")}
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
