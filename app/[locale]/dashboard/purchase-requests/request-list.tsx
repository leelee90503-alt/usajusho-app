"use client"

import { useTranslations } from "next-intl"
import { Link } from "@/i18n/navigation"

type PurchaseRequest = {
  id: string
  product_url: string | null
  product_description: string
  status: string
  quote_total_cents: number | null
  created_at: string
}

const STATUS_STYLES: Record<string, string> = {
  submitted: "bg-slate-100 text-slate-700",
  quote_sent: "bg-amber-100 text-amber-800",
  awaiting_payment: "bg-amber-100 text-amber-800",
  paid: "bg-teal-100 text-teal-800",
  purchasing: "bg-teal-100 text-teal-800",
  purchased: "bg-teal-100 text-teal-800",
  cancelled: "bg-slate-100 text-slate-500",
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
      <p className="mt-4 rounded-xl border border-dashed border-slate-300 bg-white p-8 text-center text-sm text-slate-500">
        {t("empty")}
      </p>
    )
  }

  return (
    <div className="mt-4 space-y-3">
      {requests.map((request) => (
        <Link
          key={request.id}
          href={`/dashboard/purchase-requests/${request.id}`}
          className="block rounded-xl border border-slate-200 bg-white p-4 shadow-sm hover:border-slate-300"
        >
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="font-semibold text-slate-900 line-clamp-1">
                {request.product_description}
              </p>
              {request.product_url && (
                <p className="mt-0.5 text-xs text-slate-400 line-clamp-1">
                  {request.product_url}
                </p>
              )}
            </div>
            <span
              className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-medium ${
                STATUS_STYLES[request.status] ?? "bg-slate-100 text-slate-700"
              }`}
            >
              {t(`status.${request.status}`)}
            </span>
          </div>
          {request.quote_total_cents != null && (
            <p className="mt-2 text-sm text-slate-600">
              {t("quoteLabel")}: $
              {(request.quote_total_cents / 100).toLocaleString()}
            </p>
          )}
        </Link>
      ))}
    </div>
  )
}
