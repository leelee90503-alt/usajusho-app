'use client'

import { useTransition } from "react"
import { useTranslations } from "next-intl"
import { markDeclarationMatched } from "./declarations-actions"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Check } from "lucide-react"

type Declaration = {
  id: string
  item_name: string
  order_amount: number | null
  origin_tracking_number: string | null
  note: string | null
  receipt_url: string | null
  created_at: string
  profiles: { full_name: string | null; suite_number: string | null } | null
}

export default function PendingDeclarations({ declarations }: { declarations: Declaration[] }) {
  const t = useTranslations("adminPackages")
  const [isPending, startTransition] = useTransition()

  function handleMatch(id: string) {
    startTransition(async () => {
      await markDeclarationMatched(id)
    })
  }

  if (!declarations || declarations.length === 0) {
    return null
  }

  return (
    <div className="mt-6">
      <h2 className="text-lg font-semibold text-foreground">
        {t("pendingDeclarations", { count: declarations.length })}
      </h2>
      <div className="mt-3 space-y-3">
        {declarations.map((d) => (
          <Card key={d.id}>
            <CardContent className="flex items-start justify-between gap-4 py-4">
              <div className="text-sm">
                <p className="font-semibold text-slate-900">
                  {d.profiles?.suite_number ? `#${d.profiles.suite_number} · ` : ""}
                  {d.profiles?.full_name ?? "-"}
                </p>
                <p className="mt-1">{d.item_name}</p>
                {d.order_amount != null && (
                  <p className="mt-1 text-xs text-muted-foreground">
                    {t("orderAmount")}: ${Number(d.order_amount).toLocaleString()}
                  </p>
                )}
                {d.origin_tracking_number && (
                  <p className="mt-1 text-xs text-muted-foreground">
                    {t("originTracking")}: {d.origin_tracking_number}
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
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={isPending}
                onClick={() => handleMatch(d.id)}
              >
                <Check className="h-4 w-4" />
                {t("markMatched")}
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
