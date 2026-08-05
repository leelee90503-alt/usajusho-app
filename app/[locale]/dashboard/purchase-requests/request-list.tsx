"use client"

import { useTranslations } from "next-intl"
import { Link } from "@/i18n/navigation"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ShoppingCart } from "lucide-react"

type PurchaseRequest = {
  id: string
  product_url: string | null
  product_description: string
  status: string
  quote_total_cents: number | null
  created_at: string
}

const STATUS_BADGE_CLASS: Record<string, string> = {
  submitted: "bg-slate-100 text-slate-700",
  quote_sent: "bg-amber-100 text-amber-800",
  awaiting_payment: "bg-amber-100 text-amber-800",
  paid: "bg-teal-100 text-teal-800",
  purchasing: "bg-teal-100 text-teal-800",
  purchased: "bg-teal-100 text-teal-800",
  cancelled: "bg-destructive/10 text-destructive",
  refunded: "bg-slate-100 text-slate-500",
}

export default function RequestList({
  requests,
}: {
  requests: PurchaseRequest[]
}) {
  const t = useTranslations("purchaseRequests")

  if (requests.length === 0) {
    return (
      <Card className="mt-4 border-dashed">
        <CardContent className="py-8 text-center text-sm text-muted-foreground">
          {t("empty")}
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="mt-4 space-y-3">
      {requests.map((request) => (
        <Link key={request.id} href={`/dashboard/purchase-requests/${request.id}`}>
          <Card className="transition-shadow hover:shadow-md">
            <CardContent className="py-4">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3">
                  <ShoppingCart className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                  <div>
                    <p className="font-semibold text-slate-900 line-clamp-1">
                      {request.product_description}
                    </p>
                    {request.product_url && (
                      <p className="mt-0.5 text-xs text-muted-foreground line-clamp-1">
                        {request.product_url}
                      </p>
                    )}
                  </div>
                </div>
                <Badge
                  variant="outline"
                  className={`shrink-0 border-transparent ${STATUS_BADGE_CLASS[request.status] ?? "bg-slate-100 text-slate-700"}`}
                >
                  {t(`status.${request.status}`)}
                </Badge>
              </div>
              {request.quote_total_cents != null && (
                <p className="mt-2 text-sm text-slate-600">
                  {t("quoteLabel")}: $
                  {(request.quote_total_cents / 100).toLocaleString()}
                </p>
              )}
            </CardContent>
          </Card>
        </Link>
      ))}
    </div>
  )
}
