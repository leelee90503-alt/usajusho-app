'use client'

import { useRef, useState, useTransition } from "react"
import { useTranslations } from "next-intl"
import { addPackage } from "./actions"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Loader2 } from "lucide-react"

export default function AddPackageForm() {
  const t = useTranslations("addPackageForm")
  const formRef = useRef<HTMLFormElement>(null)
  const [isPending, startTransition] = useTransition()
  const [message, setMessage] = useState<{ type: "error" | "success"; text: string } | null>(null)

  function handleSubmit(formData: FormData) {
    setMessage(null)
    startTransition(async () => {
      const result = await addPackage(formData)
      if (result?.error) {
        setMessage({ type: "error", text: result.error })
      } else {
        setMessage({ type: "success", text: t("success") })
        formRef.current?.reset()
      }
    })
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("heading")}</CardTitle>
      </CardHeader>
      <form ref={formRef} action={handleSubmit}>
        <CardContent className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="pkg-suite">{t("suiteLabel")}</Label>
            <Input id="pkg-suite" name="suite_number" required />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="pkg-item-name">{t("itemNameLabel")}</Label>
            <Input id="pkg-item-name" name="item_name" required />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="pkg-tracking">{t("trackingNumberLabel")}</Label>
            <Input id="pkg-tracking" name="tracking_number" />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="pkg-weight">{t("weightLabel")}</Label>
            <Input id="pkg-weight" name="weight_kg" type="number" step="0.01" />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="pkg-length">{t("lengthLabel")}</Label>
            <Input id="pkg-length" name="length_cm" type="number" step="0.1" />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="pkg-width">{t("widthLabel")}</Label>
            <Input id="pkg-width" name="width_cm" type="number" step="0.1" />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="pkg-height">{t("heightLabel")}</Label>
            <Input id="pkg-height" name="height_cm" type="number" step="0.1" />
          </div>

          <div className="space-y-1.5 sm:col-span-2">
            <Label htmlFor="pkg-note">{t("adminNoteLabel")}</Label>
            <Textarea id="pkg-note" name="admin_note" rows={2} />
          </div>
        </CardContent>

        <CardContent className="pt-0">
          {message && (
            <p className={message.type === "error" ? "text-sm text-destructive" : "text-sm text-accent"}>
              {message.text}
            </p>
          )}

          <Button type="submit" disabled={isPending} className="mt-4">
            {isPending && <Loader2 className="h-4 w-4 animate-spin" />}
            {isPending ? t("submitting") : t("submit")}
          </Button>
        </CardContent>
      </form>
    </Card>
  )
}
