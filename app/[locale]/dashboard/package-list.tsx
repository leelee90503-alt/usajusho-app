'use client'

import { useState, useTransition } from "react"
import { useTranslations } from "next-intl"
import { payForShipment } from "./actions"
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

type Profile = {
  full_name: string | null
  phone_number: string | null
  japan_postal_code: string | null
  japan_prefecture: string | null
  japan_city: string | null
  japan_address_line1: string | null
  japan_address_line2: string | null
}

function formatJapanAddress(profile: Profile | null) {
  if (!profile) return null
  const parts = [
    profile.japan_postal_code ? `〒${profile.japan_postal_code}` : null,
    profile.japan_prefecture,
    profile.japan_city,
    profile.japan_address_line1,
    profile.japan_address_line2,
  ].filter(Boolean)
  return parts.length > 0 ? parts.join(" ") : null
}

const STATUS_BADGE_VARIANT: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  quoted: "default",
  paid: "secondary",
  shipped: "secondary",
}

export default function PackageList({
  packages,
  profile = null,
  emptyVariant = "default",
}: {
  packages: Package[]
  profile?: Profile | null
  emptyVariant?: "default" | "completed"
}) {
  const t = useTranslations("packageList")
  const japanAddress = formatJapanAddress(profile)
  const STATUS_LABELS: Record<string, string> = {
    quoted: t("statusQuoted"),
    paid: t("statusPaid"),
    shipped: t("statusShipped"),
  }
  const [isPending, startTransition] = useTransition()
  const [payingId, setPayingId] = useState<string | null>(null)
  const [payMessage, setPayMessage] = useState<string | null>(null)

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
          {emptyVariant === "completed" ? t("emptyCompleted") : t("empty")}
          <br />
          {emptyVariant === "completed" ? t("emptyCompletedHint") : t("emptyHint")}
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="mt-3 space-y-3">
      <div className="space-y-3">
        {packages.map((pkg) => (
          <Card key={pkg.id}>
            <CardContent className="py-4">
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-3">
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
                  <div className="mt-2 space-y-0.5 border-t border-slate-200 pt-2 text-xs text-slate-600">
                    <p className="font-semibold text-slate-700">{t("quoteRecipientHeading")}</p>
                    <p>{t("quoteRecipientName")}{profile?.full_name || "—"}</p>
                    <p>{t("quoteRecipientPhone")}{profile?.phone_number || t("quoteRecipientNotSet")}</p>
                    <p>{t("quoteRecipientAddress")}{japanAddress || t("quoteRecipientNotSet")}</p>
                  </div>
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
