'use client'

import { useState } from "react"
import { useTranslations } from "next-intl"
import { Button } from "@/components/ui/button"
import { Card, CardAction, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Plus } from "lucide-react"
import RequestForm from "./request-form"

export default function NewRequestToggle() {
  const t = useTranslations("purchaseRequests")
  const [open, setOpen] = useState(false)

  if (!open) {
    return (
      <Button type="button" className="mt-8 gap-1.5" onClick={() => setOpen(true)}>
        <Plus className="h-4 w-4" />
        {t("newButton")}
      </Button>
    )
  }

  return (
    <Card className="mt-8">
      <CardHeader>
        <CardTitle>{t("newRequestTitle")}</CardTitle>
        <CardAction>
          <Button type="button" variant="ghost" size="sm" onClick={() => setOpen(false)}>
            {t("closeNewRequest")}
          </Button>
        </CardAction>
      </CardHeader>
      <CardContent>
        <RequestForm />
      </CardContent>
    </Card>
  )
}
