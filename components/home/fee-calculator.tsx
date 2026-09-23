"use client"

import { useMemo, useState } from "react"
import { Link } from "@/i18n/navigation"
import { estimateQuote, type ShippingRate } from "@/lib/pricing"
import { formatApproxJPY } from "@/lib/format"
import {
  estimateJapanCustoms,
  CUSTOMS_CATEGORIES,
  type CustomsCategoryKey,
} from "@/lib/customs-jp"
import { estimateOcsInsurance, isOverOcsInsuranceLimit } from "@/lib/insurance-jp"

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
  jpyApprox: string
  customsTitle: string
  customsItemPriceLabel: string
  customsItemPricePlaceholder: string
  customsCategoryLabel: string
  customsCategoryOther: string
  customsCategoryApparel: string
  customsCategoryFurniture: string
  customsCategoryCoffeeTea: string
  customsDutyFreeResult: string
  customsDutyLabel: string
  customsTaxLabel: string
  customsTotalLabel: string
  customsUnavailable: string
  customsDisclaimer: string
  customsLinkLabel: string
  insuranceTitle: string
  insuranceResultLabel: string
  insuranceFreeResult: string
  insuranceUnavailable: string
  insuranceOverLimit: string
  insuranceDisclaimer: string
}

const SIMPLE_CATEGORY_LABEL_KEYS: Record<string, keyof Labels> = {
  other: "customsCategoryOther",
  apparel: "customsCategoryApparel",
  furniture: "customsCategoryFurniture",
  coffeeTea: "customsCategoryCoffeeTea",
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
  const [itemPriceInput, setItemPriceInput] = useState("")
  const [categoryKey, setCategoryKey] = useState<CustomsCategoryKey>("other")

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

  const itemPriceUsd = useMemo(() => {
    const parsed = Number(itemPriceInput)
    return Number.isFinite(parsed) && parsed > 0 ? parsed : null
  }, [itemPriceInput])

  const customsEstimate = useMemo(() => {
    if (itemPriceUsd === null) return null
    return estimateJapanCustoms({ itemPriceUsd, categoryKey })
  }, [itemPriceUsd, categoryKey])

  // Shares the same declared-value input as the customs estimate above --
  // "CIF Declared Value" for insurance purposes is the same figure.
  const insuranceEstimate = useMemo(() => {
    if (itemPriceUsd === null) return null
    return estimateOcsInsurance(itemPriceUsd, "individual")
  }, [itemPriceUsd])

  const isOverInsuranceLimit = itemPriceUsd !== null && isOverOcsInsuranceLimit(itemPriceUsd)

  const simpleCategories = CUSTOMS_CATEGORIES.filter((c) => c.simple)

  return (
    <div className="min-w-0 bg-white border border-slate-200 rounded-lg p-6">
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
          className="flex-1 min-w-0 rounded-md border border-slate-300 px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-[var(--usj-accent)] focus:border-transparent"
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
          className="flex-1 min-w-0 rounded-md border border-slate-300 px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-[var(--usj-accent)] focus:border-transparent"
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
          className="flex-1 min-w-0 rounded-md border border-slate-300 px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-[var(--usj-accent)] focus:border-transparent"
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
          className="flex-1 min-w-0 rounded-md border border-slate-300 px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-[var(--usj-accent)] focus:border-transparent"
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
            <p className="text-xs text-slate-400 mt-0.5">
              {labels.jpyApprox.replace("{jpy}", formatApproxJPY(estimate.amount))}
            </p>
          </>
        ) : isOverweight ? (
          <p className="text-sm text-slate-400">{labels.overweightContact}</p>
        ) : (
          <p className="text-sm text-slate-400">{labels.unavailable}</p>
        )}
      </div>

      <p className="text-xs text-slate-400 mt-3">{labels.disclaimer}</p>

      <div className="mt-6 pt-6 border-t border-slate-100">
        <p className="text-sm font-medium text-[var(--usj-text)] mb-3">{labels.customsTitle}</p>

        <label htmlFor="home-item-price" className="block text-xs text-slate-500 mb-1.5">
          {labels.customsItemPriceLabel}
        </label>
        <div className="flex gap-2 mb-3">
          <span className="flex items-center text-sm text-slate-500 px-1">$</span>
          <input
            id="home-item-price"
            type="number"
            inputMode="decimal"
            min="0"
            step="1"
            value={itemPriceInput}
            onChange={(e) => setItemPriceInput(e.target.value)}
            placeholder={labels.customsItemPricePlaceholder}
            className="flex-1 min-w-0 rounded-md border border-slate-300 px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-[var(--usj-accent)] focus:border-transparent"
          />
        </div>

        <label htmlFor="home-item-category" className="block text-xs text-slate-500 mb-1.5">
          {labels.customsCategoryLabel}
        </label>
        <select
          id="home-item-category"
          value={categoryKey}
          onChange={(e) => setCategoryKey(e.target.value as CustomsCategoryKey)}
          className="w-full mb-4 rounded-md border border-slate-300 px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-[var(--usj-accent)] focus:border-transparent bg-white"
        >
          {simpleCategories.map((c) => (
            <option key={c.key} value={c.key}>
              {labels[SIMPLE_CATEGORY_LABEL_KEYS[c.key]]}
            </option>
          ))}
        </select>

        <div className="rounded-md bg-[var(--usj-surface)] px-4 py-4 min-h-[64px] flex flex-col justify-center">
          {customsEstimate ? (
            customsEstimate.isDutyFree ? (
              <p className="text-sm font-semibold text-emerald-700">{labels.customsDutyFreeResult}</p>
            ) : (
              <div className="space-y-1">
                <div className="flex justify-between text-xs text-slate-500">
                  <span>{labels.customsDutyLabel}</span>
                  <span>¥{customsEstimate.dutyJpy.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-xs text-slate-500">
                  <span>{labels.customsTaxLabel}</span>
                  <span>
                    ¥{(customsEstimate.consumptionTaxJpy + customsEstimate.localConsumptionTaxJpy).toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between text-sm font-bold text-[var(--usj-primary)] pt-1">
                  <span>{labels.customsTotalLabel}</span>
                  <span>¥{customsEstimate.totalTaxJpy.toLocaleString()}</span>
                </div>
              </div>
            )
          ) : (
            <p className="text-sm text-slate-400">{labels.customsUnavailable}</p>
          )}
        </div>

        <p className="text-xs text-slate-400 mt-3">
          {labels.customsDisclaimer}{" "}
          <Link href="/customs" className="text-primary underline underline-offset-2">
            {labels.customsLinkLabel}
          </Link>
        </p>
      </div>

      <div className="mt-6 pt-6 border-t border-slate-100">
        <p className="text-sm font-medium text-[var(--usj-text)] mb-3">{labels.insuranceTitle}</p>

        <div className="rounded-md bg-[var(--usj-surface)] px-4 py-4 min-h-[64px] flex flex-col justify-center">
          {isOverInsuranceLimit ? (
            <p className="text-sm text-slate-400">{labels.insuranceOverLimit}</p>
          ) : insuranceEstimate ? (
            insuranceEstimate.isFree ? (
              <p className="text-sm font-semibold text-emerald-700">{labels.insuranceFreeResult}</p>
            ) : (
              <div className="flex justify-between text-sm font-bold text-[var(--usj-primary)]">
                <span>{labels.insuranceResultLabel}</span>
                <span>${insuranceEstimate.feeUsd.toLocaleString()}</span>
              </div>
            )
          ) : (
            <p className="text-sm text-slate-400">{labels.insuranceUnavailable}</p>
          )}
        </div>

        <p className="text-xs text-slate-400 mt-3">{labels.insuranceDisclaimer}</p>
      </div>
    </div>
  )
}
