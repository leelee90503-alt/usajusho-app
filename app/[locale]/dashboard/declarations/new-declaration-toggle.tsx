'use client'

import { useState } from "react"
import { useTranslations } from "next-intl"
import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"
import DeclarationForm from "./declaration-form"

export default function NewDeclarationToggle() {
  const t = useTranslations("packageDeclarations")
  const [open, setOpen] = useState(false)

  if (!open) {
    return (
      <Button type="button" className="gap-1.5" onClick={() => setOpen(true)}>
        <Plus className="h-4 w-4" />
        {t("newButton")}
      </Button>
    )
  }

  return <DeclarationForm onClose={() => setOpen(false)} />
}
