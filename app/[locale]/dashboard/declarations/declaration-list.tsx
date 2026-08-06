'use client'

import { useState, useTransition } from "react"
import { useTranslations } from "next-intl"
import { updateDeclarationDetails } from "./actions"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Pencil } from "lucide-react"

type Declaration = {
  id: string
  item_name: string
  order_amount: number | null
  origin_tracking_number: string | null
  note: string | null
  receipt_url: string | null
  status: string
  created_at: string
}

const STATUS_VARIANT: Record<string, "default" | "secondary" | "outline"> = {
  pending: "outline",
  matched: "default",
  cancelled: "secondary",
}

function DeclarationCard({ declaration: d }: { declaration: Declaration }) {
  const t = useTranslations("packageDeclarations")
  const [isEditing, setIsEditing] = useState(false)
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)
  const [tracking, setTracking] = useState(d.origin_tracking_number ?? "")
  const [note, setNote] = useState(d.note ?? "")

  function openEdit() {
    setTracking(d.origin_tracking_number ?? "")
    setNote(d.note ?? "")
    setError(null)
    setIsEditing(true)
  }

  function closeEdit() {
    setIsEditing(false)
    setError(null)
  }

  function handleSave() {
    setError(null)
    setNotice(null)
    startTransition(async () => {
      const result = await updateDeclarationDetails(d.id, {
        origin_tracking_number: tracking,
        note,
      })
      if (result?.error) {
        setError(result.error)
      } else {
        setNotice(t("infoUpdated"))
        setIsEditing(false)
      }
    })
  }

  return (
    <Card>
      <CardContent className="py-4">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="font-semibold text-slate-900">{d.item_name}</p>
            {d.order_amount != null && (
              <p className="mt-1 text-xs text-muted-foreground">
                {t("orderAmountLabel")}: ${Number(d.order_amount).toLocaleString()}
              </p>
            )}
            {d.origin_tracking_number && (
              <p className="mt-1 text-xs text-muted-foreground">
                {t("trackingLabel")}: {d.origin_tracking_number}
              </p>
            )}
            {d.note && <p className="mt-1 text-xs text-slate-600">{d.note}</p>}
            {d.receipt_url && (
              <a
                href={d.receipt_url}
                target="_blank"
                rel="noreferrer"
                className="mt-1 inline-block text-xs text-primary underline"
              >
                {t("viewReceipt")}
              </a>
            )}
          </div>
          <div className="flex flex-col items-end gap-2">
            <Badge variant={STATUS_VARIANT[d.status] ?? "outline"}>
              {t(`status.${d.status}`)}
            </Badge>
            {d.status === "pending" && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                disabled={isPending}
                onClick={() => (isEditing ? closeEdit() : openEdit())}
              >
                <Pencil className="h-4 w-4" />
                {t("addInfo")}
              </Button>
            )}
          </div>
        </div>

        {notice && !isEditing && (
          <p className="mt-3 rounded-md bg-teal-50 px-3 py-2 text-sm text-teal-800">{notice}</p>
        )}

        {isEditing && (
          <div className="mt-3 space-y-3 border-t pt-3">
            <div className="space-y-1.5">
              <Label htmlFor={`tracking-${d.id}`}>{t("trackingLabel")}</Label>
              <Input
                id={`tracking-${d.id}`}
                value={tracking}
                onChange={(e) => setTracking(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor={`note-${d.id}`}>{t("noteLabel")}</Label>
              <Textarea
                id={`note-${d.id}`}
                rows={3}
                value={note}
                onChange={(e) => setNote(e.target.value)}
              />
            </div>
            {error && <p className="text-sm text-destructive">{error}</p>}
            <div className="flex gap-2">
              <Button type="button" size="sm" disabled={isPending} onClick={handleSave}>
                {t("saveInfo")}
              </Button>
              <Button type="button" variant="outline" size="sm" onClick={closeEdit}>
                {t("cancel")}
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

export default function DeclarationList({ declarations }: { declarations: Declaration[] }) {
  const t = useTranslations("packageDeclarations")

  if (!declarations || declarations.length === 0) {
    return (
      <Card className="mt-4 border-dashed">
        <CardContent className="py-6 text-center text-sm text-muted-foreground">
          {t("empty")}
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="mt-4 space-y-3">
      {declarations.map((d) => (
        <DeclarationCard key={d.id} declaration={d} />
      ))}
    </div>
  )
}
