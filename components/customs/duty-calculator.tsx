"use client"

import { useMemo, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  estimateJapanCustoms,
  CUSTOMS_CATEGORIES,
  type CustomsCategoryKey,
} from "@/lib/customs-jp"
import type { DutyCalculatorLabels } from "@/content/customs/types"

const CATEGORY_LABEL_KEYS: Record<CustomsCategoryKey, keyof DutyCalculatorLabels> = {
  other: "categoryOther",
  apparel: "categoryApparel",
  furniture: "categoryFurniture",
  coffeeTea: "categoryCoffeeTea",
  furSauce: "categoryFurSauce",
  rubberPaperSteel: "categoryRubberPaperSteel",
}

export default function DutyCalculator({ labels }: { labels: DutyCalculatorLabels }) {
  const [itemPriceInput, setItemPriceInput] = useState("")
  const [categoryKey, setCategoryKey] = useState<CustomsCategoryKey>("other")

  const itemPriceUsd = useMemo(() => {
    const parsed = Number(itemPriceInput)
    return Number.isFinite(parsed) && parsed > 0 ? parsed : null
  }, [itemPriceInput])

  const estimate = useMemo(() => {
    if (itemPriceUsd === null) return null
    return estimateJapanCustoms({ itemPriceUsd, categoryKey })
  }, [itemPriceUsd, categoryKey])

  return (
    <Card className="mb-6 bg-white">
      <CardHeader>
        <CardTitle className="text-lg">{labels.title}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm leading-relaxed text-slate-600">{labels.intro}</p>

        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label htmlFor="customs-item-price" className="block text-xs text-slate-500 mb-1.5">
              {labels.itemPriceLabel}
            </label>
            <div className="flex gap-2">
              <span className="flex items-center text-sm text-slate-500 px-1">$</span>
              <input
                id="customs-item-price"
                type="number"
                inputMode="decimal"
                min="0"
                step="1"
                value={itemPriceInput}
                onChange={(e) => setItemPriceInput(e.target.value)}
                placeholder={labels.itemPricePlaceholder}
                className="flex-1 min-w-0 rounded-md border border-slate-300 px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-[var(--usj-accent)] focus:border-transparent"
              />
            </div>
          </div>
          <div>
            <label htmlFor="customs-item-category" className="block text-xs text-slate-500 mb-1.5">
              {labels.categoryLabel}
            </label>
            <select
              id="customs-item-category"
              value={categoryKey}
              onChange={(e) => setCategoryKey(e.target.value as CustomsCategoryKey)}
              className="w-full rounded-md border border-slate-300 px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-[var(--usj-accent)] focus:border-transparent bg-white"
            >
              {CUSTOMS_CATEGORIES.map((c) => (
                <option key={c.key} value={c.key}>
                  {labels[CATEGORY_LABEL_KEYS[c.key]]}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="rounded-md bg-[var(--usj-surface)] px-4 py-4 min-h-[64px] flex flex-col justify-center">
          {estimate ? (
            estimate.isDutyFree ? (
              <p className="text-sm font-semibold text-emerald-700">{labels.dutyFreeResult}</p>
            ) : (
              <div className="space-y-1">
                <div className="flex justify-between text-xs text-slate-500">
                  <span>{labels.dutyLabel}</span>
                  <span>¥{estimate.dutyJpy.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-xs text-slate-500">
                  <span>{labels.taxLabel}</span>
                  <span>¥{(estimate.consumptionTaxJpy + estimate.localConsumptionTaxJpy).toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-sm font-bold text-[var(--usj-primary)] pt-1">
                  <span>{labels.totalLabel}</span>
                  <span>¥{estimate.totalTaxJpy.toLocaleString()}</span>
                </div>
              </div>
            )
          ) : (
            <p className="text-sm text-slate-400">{labels.unavailable}</p>
          )}
        </div>

        <p className="text-xs text-slate-400">{labels.disclaimer}</p>
      </CardContent>
    </Card>
  )
}
