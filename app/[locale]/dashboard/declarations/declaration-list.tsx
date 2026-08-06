'use client'

import { useTransition } from "react"
import { useTranslations } from "next-intl"
import { deleteDeclaration } from "./actions"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Trash2 } from "lucide-react"

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

export default function DeclarationList({ declarations }: { declarations: Declaration[] }) {
  const t = useTranslations("packageDeclarations")
  const [isPending, startTransition] = useTransition()

  if (!declarations || declarations.length === 0) {
    return (
      <Card className="mt-4 border-dashed">
        <CardContent className="py-6 text-center text-sm text-muted-foreground">
          {t("empty")}
        </CardContent>
      </Card>
    )
  }

  function handleDelete(id: string) {
    startTransition(async () => {
      await deleteDeclaration(id)
    })
  }

  return (
    <div className="mt-4 space-y-3">
      {declarations.map((d) => (
        <Card key={d.id}>
          <CardContent className="flex items-start justify-between gap-4 py-4">
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
                  onClick={() => handleDelete(d.id)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
