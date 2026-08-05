'use client'

import { useState, useTransition } from "react"
import { useTranslations } from "next-intl"
import { requestShipment, payForShipment } from "./actions"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Package as PackageIcon } from "lucide-react"

type Package = {
  id: string
  item_name: string
  tracking_number: string | null
  weight_lbs: number | null
  admin_note: string | null
  status: string
  quote_amount: number | null
  quote_note: string | null
}

const STATUS_BADGE_VARIANT: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  arrived: "outline",
  requested: "secondary",
  quoted: "default",
  paid: "secondary",
  shipped: "secondary",
}

export default function PackageList({ packages }: { packages: Package[] }) {
  const t = useTranslations("packageList")
  const STATUS_LABELS: Record<string, string> = {
    arrived: t("statusArrived"),
    requested: t("statusRequested"),
    quoted: t("statusQuoted"),
    paid: t("statusPaid"),
    shipped: t("statusShipped"),
  }
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [isPending, startTransition] = useTransition()
  const [message, setMessage] = useState<string | null>(null)
  const [payingId, setPayingId] = useState<string | null>(null)
  const [payMessage, setPayMessage] = useState<string | null>(null)

  const arrivedPackages = packages.filter((p) => p.status === "arrived")

  function toggleSelected(id: string) {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
      } else {
        next.add(id)
      }
      return next
    })
  }

  function handleRequestShipment() {
    setMessage(null)
    startTransition(async () => {
      const result = await requestShipment(Array.from(selected))
      if (result?.error) {
        setMessage(result.error)
      } else {
        setMessage(t("requestSuccess"))
        setSelected(new Set())
      }
    })
  }

  function handlePay(id: string) {
    setPayMessage(null)
    setPayingId(id)
    startTransition(async () => {
      const result = await payForShipment(id)
      if (result?.error) {
        setPayMessage(result.error)
      } else {
        setPayMessage(t("paySuccess"))
      }
      setPayingId(null)
    })
  }

  if (!packages || packages.length === 0) {
    return (
      <Card className="mt-3 border-dashed">
        <CardContent className="py-8 text-center text-sm text-muted-foreground">
          {t("empty")}
          <br />
          {t("emptyHint")}
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="mt-3 space-y-3">
      {arrivedPackages.length > 0 && (
        <Card className="border-primary/20 bg-primary/5">
          <CardContent className="flex items-center justify-between gap-4 py-4">
            <p className="text-sm text-primary">{t("selectPrompt")}</p>
            <Button
              type="button"
              onClick={handleRequestShipment}
              disabled={isPending || selected.size === 0}
              size="sm"
            >
              {t("requestShipment", { count: selected.size })}
            </Button>
          </CardContent>
        </Card>
      )}

      {message && <p className="text-sm text-primary">{message}</p>}

      <div className="space-y-3">
        {packages.map((pkg) => (
          <Card key={pkg.id}>
            <CardContent className="py-4">
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-3">
                  {pkg.status === "arrived" && (
                    <input
                      type="checkbox"
                      checked={selected.has(pkg.id)}
                      onChange={() => toggleSelected(pkg.id)}
                      className="mt-1 h-4 w-4"
                    />
                  )}
                  <PackageIcon className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                  <div>
                    <p className="font-semibold text-slate-900">{pkg.item_name}</p>
                    {pkg.tracking_number && (
                      <p className="mt-1 text-xs text-muted-foreground">
                        {t("trackingNumber")}{pkg.tracking_number}
                      </p>
                    )}
                    {pkg.weight_lbs && (
                      <p className="mt-1 text-xs text-muted-foreground">
                        {t("weight")}{pkg.weight_lbs} {t("weightUnit")}
                      </p>
                    )}
                    {pkg.admin_note && (
                      <p className="mt-2 text-xs text-slate-600">{pkg.admin_note}</p>
                    )}
                  </div>
                </div>
                <Badge variant={STATUS_BADGE_VARIANT[pkg.status] ?? "outline"} className="whitespace-nowrap">
                  {STATUS_LABELS[pkg.status] || pkg.status}
                </Badge>
              </div>

              {pkg.status === "quoted" && pkg.quote_amount && (
                <div className="mt-3 rounded-lg bg-slate-50 p-3">
                  <p className="text-sm text-slate-700">
                    {t("quoteLabel")}¥{Number(pkg.quote_amount).toLocaleString()}
                  </p>
                  {pkg.quote_note && (
                    <p className="mt-1 text-xs text-muted-foreground">{pkg.quote_note}</p>
                  )}
                  <Button
                    type="button"
                    onClick={() => handlePay(pkg.id)}
                    disabled={isPending && payingId === pkg.id}
                    size="sm"
                    className="mt-2"
                  >
                    {t("pay")}
                  </Button>
                  {payMessage && payingId === null && (
                    <p className="mt-2 text-sm text-primary">{payMessage}</p>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
