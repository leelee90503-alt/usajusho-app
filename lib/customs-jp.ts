// Japan personal-import customs duty / consumption tax estimator.
//
// This mirrors the rules already documented in content/customs/{en,ja}.ts
// (see taxFreeParagraphs / taxTable / taxDutiedList / taxPolicyNotice
// there) -- keep the category set and rates in sync with that page if
// either changes.
//
// Current rules (in effect until the FY2026 tax reform takes effect on
// 2028-04-01, per taxPolicyNotice in content/customs/*):
//   1. Dutiable value = overseas retail price (incl. int'l shipping is
//      excluded) x 60%, for goods imported for personal use.
//   2. If that dutiable value is <=10,000 JPY, duty + consumption tax are
//      both waived -- EXCEPT for the categories in ALWAYS_DUTIED_CATEGORY
//      (leather goods, knitwear, footwear, gloves/hosiery, small
//      accessories), which stay dutiable even under the threshold.
//   3. If dutiable value is >10,000 JPY (and <=200,000 JPY), a simplified
//      per-category tariff rate applies (see CUSTOMS_CATEGORIES below).
//   4. Consumption tax (national 7.8% + local 2.2%, ~10% combined) is
//      charged on (dutiable value + duty).
//
// This is a reference/estimate tool only, not a customs declaration --
// every caller must surface that disclaimer next to the result.
import { APPROX_USD_TO_JPY_RATE } from "@/lib/format"

export const CUSTOMS_REFORM_EFFECTIVE_DATE = "2028-04-01"

export type CustomsCategoryKey =
  | "other" // "everything else" -- simplified rate row 7
  | "apparel" // clothing & accessories excl. knitwear -- row 4
  | "furniture" // plastic/glass/precious-metal/furniture -- row 5
  | "coffeeTea" // coffee, tea excl. black tea -- row 3
  | "furSauce" // tomato sauce, ice cream, fur products -- row 2
  | "rubberPaperSteel" // rubber/paper/steel/ceramic -- row 6

export type CustomsCategory = {
  key: CustomsCategoryKey
  ratePercent: number
  // Shown in the compact (homepage) category picker. The remaining
  // categories still work but are only offered in the detailed
  // calculator on the customs guide page.
  simple: boolean
}

export const CUSTOMS_CATEGORIES: CustomsCategory[] = [
  { key: "other", ratePercent: 5, simple: true },
  { key: "apparel", ratePercent: 10, simple: true },
  { key: "furniture", ratePercent: 3, simple: true },
  { key: "coffeeTea", ratePercent: 15, simple: true },
  { key: "furSauce", ratePercent: 20, simple: false },
  { key: "rubberPaperSteel", ratePercent: 0, simple: false },
]

export const DUTY_FREE_THRESHOLD_JPY = 10000
export const PERSONAL_USE_VALUATION_RATE = 0.6
export const CONSUMPTION_TAX_NATIONAL_RATE = 0.078
export const CONSUMPTION_TAX_LOCAL_RATIO = 22 / 78 // of the national consumption tax amount

export type CustomsEstimateInput = {
  itemPriceUsd: number
  categoryKey: CustomsCategoryKey
  usdToJpyRate?: number
}

export type CustomsEstimate = {
  dutiableValueJpy: number
  isDutyFree: boolean
  dutyJpy: number
  consumptionTaxJpy: number
  localConsumptionTaxJpy: number
  totalTaxJpy: number
}

export function estimateJapanCustoms({
  itemPriceUsd,
  categoryKey,
  usdToJpyRate = APPROX_USD_TO_JPY_RATE,
}: CustomsEstimateInput): CustomsEstimate | null {
  if (!Number.isFinite(itemPriceUsd) || itemPriceUsd <= 0) return null
  const category = CUSTOMS_CATEGORIES.find((c) => c.key === categoryKey)
  if (!category) return null

  const itemPriceJpy = itemPriceUsd * usdToJpyRate
  const dutiableValueJpy = Math.round(itemPriceJpy * PERSONAL_USE_VALUATION_RATE)

  const isDutyFree = dutiableValueJpy <= DUTY_FREE_THRESHOLD_JPY

  if (isDutyFree) {
    return {
      dutiableValueJpy,
      isDutyFree: true,
      dutyJpy: 0,
      consumptionTaxJpy: 0,
      localConsumptionTaxJpy: 0,
      totalTaxJpy: 0,
    }
  }

  const dutyJpy = Math.round((dutiableValueJpy * category.ratePercent) / 100)
  const consumptionTaxBaseJpy = dutiableValueJpy + dutyJpy
  const consumptionTaxJpy = Math.round(consumptionTaxBaseJpy * CONSUMPTION_TAX_NATIONAL_RATE)
  const localConsumptionTaxJpy = Math.round(consumptionTaxJpy * CONSUMPTION_TAX_LOCAL_RATIO)
  const totalTaxJpy = dutyJpy + consumptionTaxJpy + localConsumptionTaxJpy

  return {
    dutiableValueJpy,
    isDutyFree: false,
    dutyJpy,
    consumptionTaxJpy,
    localConsumptionTaxJpy,
    totalTaxJpy,
  }
}
