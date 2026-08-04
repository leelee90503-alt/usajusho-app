"use client"

import { useMemo, useState } from "react"
import { estimateQuote, type ShippingRate } from "@/lib/pricing"

type Labels = {
  weightLabel: string
  weightPlaceholder: string
  dimensionsLabel: string
  lengthPlaceholder: string
  widthPlaceholder: string
  heightPlaceholder: string
  dimensionsHint: string
  resultLabel: string
  unavailable: string
  disclaimer: string
  currency: string
  overweightContact: string
}

export default function FeeCalculator({
  rates,
  labels,
}: {
  rates: ShippingRate[]
  labels: Labels
}) {
  const [weightInput, setWeightInput] = useState("")
  const [lengthInput, setLengthInput] = useState("")
  const [widthInput, setWidthInput] = useState("")
  const [heightInput, setHeightInput] = useState("")

  const weightKg = useMemo(() => {
    const parsed = Number(weightInput)
    return Number.isFinite(parsed) && parsed > 0 ? parsed : null
  }, [weightInput])

  const lengthCm = useMemo(() => {
    const parsed = Number(lengthInput)
    return Number.isFinite(parsed) && parsed > 0 ? parsed : null
  }, [lengthInput])

  const widthCm = useMemo(() => {
    const parsed = Number(widthInput)
    return Number.isFinite(parsed) && parsed > 0 ? parsed : null
  }, [widthInput])

  const heightCm = useMemo(() => {
    const parsed = Number(heightInput)
    return Number.isFinite(parsed) && parsed > 0 ? parsed : null
  }, [heightInput])

  const estimate = useMemo(() => {
    if (weightKg === null || rates.length === 0) return null
    return estimateQuote({ weightKg, lengthCm, widthCm, heightCm }, rates)
  }, [weightKg, lengthCm, widthCm, heightCm, rates])

  // Packages over 50kg (the carrier's max per-carton weight) are intentionally
  // left unrated, so surface a distinct "contact us" message instead of the
  // generic unavailable copy in that case.
  const isOverweight = weightKg !== null && weightKg > 50

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
          className="flex-1 rounded-md border border-slate-300 px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-[var(--usj-accent)] focus:border-transparent"
        />
        <span className="flex items-center text-sm text-slate-500 px-1">kg</span>
      </div>


      <label className="block text-sm font-medium text-[var(--usj-text)] mb-2">
        {labels.dimensionsLabel}
      </label>
      <div className="flex gap-2 mb-1 items-center">
        <input
          type="number"
          inputMode="decimal"
          min="0"
          step="0.1"
          value={lengthInput}
          onChange={(e) => setLengthInput(e.target.value)}
          placeholder={labels.lengthPlaceholder}
          aria-label={labels.lengthPlaceholder}
          className="flex-1 rounded-md border border-slate-300 px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-[var(--usj-accent)] focus:border-transparent"
        />
        <span className="text-slate-400 text-sm">x</span>
        <input
          type="number"
          inputMode="decimal"
          min="0"
          step="0.1"
          value={widthInput}
          onChange={(e) => setWidthInput(e.target.value)}
          placeholder={labels.widthPlaceholder}
          aria-label={labels.widthPlaceholder}
          className="flex-1 rounded-md border border-slate-300 px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-[var(--usj-accent)] focus:border-transparent"
        />
        <span className="text-slate-400 text-sm">x</span>
        <input
          type="number"
          inputMode="decimal"
          min="0"
          step="0.1"
          value={heightInput}
          onChange={(e) => setHeightInput(e.target.value)}
          placeholder={labels.heightPlaceholder}
          aria-label={labels.heightPlaceholder}
          className="flex-1 rounded-md border border-slate-300 px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-[var(--usj-accent)] focus:border-transparent"
        />
        <span className="flex items-center text-sm text-slate-500 px-1">cm</span>
      </div>
      <p className="text-xs text-slate-400 mb-4">{labels.dimensionsHint}</p>

      <div className="rounded-md bg-[var(--usj-surface)] px-4 py-4 min-h-[64px] flex flex-col justify-center">
        {estimate?.amount != null ? (
          <>
            <p className="text-xs text-slate-500 mb-1">{labels.resultLabel}</p>
            <p className="text-2xl font-bold text-[var(--usj-primary)]">
              {labels.currency}
              {estimate.amount.toLocaleString()}
            </p>
          </>
        ) : isOverweight ? (
          <p className="text-sm text-slate-400">{labels.overweightContact}</p>
        ) : (
          <p className="text-sm text-slate-400">{labels.unavailable}</p>
        )}
      </div>

      <p className="text-xs text-slate-400 mt-3">{labels.disclaimer}</p>
    </div>
  )
}
