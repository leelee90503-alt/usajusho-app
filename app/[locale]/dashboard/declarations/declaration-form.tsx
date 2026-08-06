'use client'

import { useRef, useState, useTransition } from "react"
import { useTranslations } from "next-intl"
import { createDeclaration } from "./actions"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Loader2 } from "lucide-react"

export default function DeclarationForm() {
  const t = useTranslations("packageDeclarations")
  const formRef = useRef<HTMLFormElement>(null)
  const [isPending, startTransition] = useTransition()
  const [message, setMessage] = useState<{ type: "error" | "success"; text: string } | null>(null)

  function handleSubmit(formData: FormData) {
    setMessage(null)
    startTransition(async () => {
      const result = await createDeclaration(formData)
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
        <CardTitle>{t("formHeading")}</CardTitle>
      </CardHeader>
      <form ref={formRef} action={handleSubmit}>
        <CardContent className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="space-y-1.5 sm:col-span-2">
            <Label htmlFor="decl-item-name">{t("itemNameLabel")}</Label>
            <Input id="decl-item-name" name="item_name" required />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="decl-amount">{t("orderAmountLabel")}</Label>
            <Input id="decl-amount" name="order_amount" type="number" step="0.01" min="0" />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="decl-tracking">{t("trackingLabel")}</Label>
            <Input id="decl-tracking" name="origin_tracking_number" />
            <p className="text-xs text-muted-foreground">{t("trackingHint")}</p>
          </div>

          <div className="space-y-1.5 sm:col-span-2">
            <Label htmlFor="decl-note">{t("noteLabel")}</Label>
            <Textarea id="decl-note" name="note" rows={3} />
          </div>

          <div className="space-y-1.5 sm:col-span-2">
            <Label htmlFor="decl-receipt">{t("receiptLabel")}</Label>
            <Input id="decl-receipt" name="receipt" type="file" accept="image/*,.pdf" />
          </div>

          {message && (
            <p
              className={`sm:col-span-2 text-sm ${
                message.type === "error" ? "text-destructive" : "text-accent"
              }`}
            >
              {message.text}
            </p>
          )}

          <Button type="submit" disabled={isPending} className="sm:col-span-2">
            {isPending && <Loader2 className="h-4 w-4 animate-spin" />}
            {isPending ? t("submitting") : t("submit")}
          </Button>
        </CardContent>
      </form>
    </Card>
  )
}
