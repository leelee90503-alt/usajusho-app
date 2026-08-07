'use client'

import { useState, useTransition } from "react"
import { useTranslations } from "next-intl"
import { markDeclarationMatched, adminDeleteDeclaration } from "./declarations-actions"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Check, Trash2 } from "lucide-react"

type PackageCandidate = {
  id: string
  item_name: string
  tracking_number: string | null
}

type Declaration = {
  id: string
  item_name: string
  order_amount: number | null
  origin_tracking_number: string | null
  note: string | null
  receipt_url: string | null
  created_at: string
  profiles: { full_name: string | null; suite_number: string | null } | null
  candidates: PackageCandidate[]
}

export default function PendingDeclarations({ declarations }: { declarations: Declaration[] }) {
  const t = useTranslations("adminPackages")
  const [isPending, startTransition] = useTransition()
  const [errorByDeclarationId, setErrorByDeclarationId] = useState<Record<string, string>>({})

  function handleMatch(declarationId: string, packageId: string) {
    if (!packageId) {
      setErrorByDeclarationId((prev) => ({ ...prev, [declarationId]: t("matchMissingSelection") }))
      return
    }
    setErrorByDeclarationId((prev) => ({ ...prev, [declarationId]: "" }))
    startTransition(async () => {
      const result = await markDeclarationMatched(declarationId, packageId)
      if (result?.error) {
        setErrorByDeclarationId((prev) => ({ ...prev, [declarationId]: result.error as string }))
      }
    })
  }

  function handleDelete(id: string) {
    if (!window.confirm(t("confirmDeleteDeclaration"))) {
      return
    }
    startTransition(async () => {
      await adminDeleteDeclaration(id)
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
          <DeclarationCard
            key={d.id}
            declaration={d}
            isPending={isPending}
            error={errorByDeclarationId[d.id]}
            onMatch={(packageId) => handleMatch(d.id, packageId)}
            onDelete={() => handleDelete(d.id)}
          />
        ))}
      </div>
    </div>
  )
}

function DeclarationCard({
  declaration: d,
  isPending,
  error,
  onMatch,
  onDelete,
}: {
  declaration: Declaration
  isPending: boolean
  error?: string
  onMatch: (packageId: string) => void
  onDelete: () => void
}) {
  const t = useTranslations("adminPackages")
  const [selectedPackageId, setSelectedPackageId] = useState("")

  return (
    <Card>
      <CardContent className="flex flex-col gap-3 py-4 sm:flex-row sm:items-start sm:justify-between">
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
        <div className="flex flex-col items-end gap-2">
          {d.candidates.length > 0 ? (
            <div className="flex flex-wrap items-center justify-end gap-2">
              <select
                value={selectedPackageId}
                onChange={(e) => setSelectedPackageId(e.target.value)}
                disabled={isPending}
                className="h-8 rounded-lg border border-input bg-transparent px-2 text-xs outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
              >
                <option value="">{t("matchSelectPlaceholder")}</option>
                {d.candidates.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.item_name}
                    {c.tracking_number ? ` (${c.tracking_number})` : ""}
                  </option>
                ))}
              </select>
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={isPending}
                onClick={() => onMatch(selectedPackageId)}
              >
                <Check className="h-4 w-4" />
                {t("matchConfirm")}
              </Button>
            </div>
          ) : (
            <p className="text-xs text-muted-foreground">{t("matchNoCandidates")}</p>
          )}
          {error && <p className="text-xs text-destructive">{error}</p>}
          <Button
            type="button"
            variant="ghost"
            size="sm"
            disabled={isPending}
            onClick={onDelete}
          >
            <Trash2 className="h-4 w-4" />
            {t("deleteDeclaration")}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
