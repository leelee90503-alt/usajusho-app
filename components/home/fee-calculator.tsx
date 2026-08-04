"use client"

import { useMemo, useState } from "react"
import { estimateQuote, type ShippingRate } from "@/lib/pricing"

type Labels = {
  weightLabel: string
  weightPlaceholder: string
  resultLabel: string
  unavailable: string
  disclaimer: string
  currency: string
}

export default function FeeCalculator({
  rates,
  labels,
}: {
  rates: ShippingRate[]
  labels: Labels
}) {
  const [weightInput, setWeightInput] = useState("")

  const weightKg = useMemo(() => {
    const parsed = Number(weightInput)
    return Number.isFinite(parsed) && parsed > 0 ? parsed : null
  }, [weightInput])

  const estimate = useMemo(() => {
    if (weightKg === null || rates.length === 0) return null
    return estimateQuote({ weightKg, lengthCm: null, widthCm: null, heightCm: null }, rates)
  }, [weightKg, rates])

  return (
    <div className="bg-white border border-slate-200 rounded-lg p-6">
      <label htmlFor="home-weight-kg" className="block text-sm font-medium text-[var(--usj-text)] mb-2">
        {labels.weightLabel}
      </label>
      <div className="flex gap-2 mb-4">
        <input
          id="home-weight-kg"
          type="number"
          inputMode="decimal"
          min="0"
          step="0.1"
          value={weightInput}
          onChange={(e) => setWeightInput(e.target.value)}
          placeholder={labels.weightPlaceholder}
          className="flex-1 rounded-md border border-slate-300 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--usj-accent)] focus:border-transparent"
        />
        <span className="flex items-center text-sm text-slate-500 px-1">kg</span>
      </div>

      <div className="rounded-md bg-[var(--usj-surface)] px-4 py-4 min-h-[64px] flex flex-col justify-center">
        {estimate?.amount != null ? (
          <>
            <p className="text-xs text-slate-500 mb-1">{labels.resultLabel}</p>
            <p className="text-2xl font-bold text-[var(--usj-primary)]">
              {labels.currency}
              {estimate.amount.toLocaleString()}
            </p>
          </>
        ) : (
          <p className="text-sm text-slate-400">{labels.unavailable}</p>
        )}
      </div>

      <p className="text-xs text-slate-400 mt-3">{labels.disclaimer}</p>
    </div>
  )
}
