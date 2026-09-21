// OCS Worldwide shipping insurance rates for the US -> Japan leg (both
// forwarding and purchase-agency shipments use OCS for this leg -- see
// lib/carrier-detect.ts). Source: "INSURANCE Rate.pdf" (OCS Insurance
// Price List, effective 2025/01/01).
//
// The fee is looked up by "CIF Declared Value" -- effectively the item's
// declared value in USD, the same figure customers already enter for the
// customs-duty estimate above this section in the fee calculator, so no
// separate input is needed.
//
// OCS's own terms automatically compensate up to US$100 per shipment at no
// charge, which is why $100 and under costs nothing. Above that, the table
// only lists specific CIF brackets (every $100 up to $5,000, then every
// $500 up to $10,000) -- a declared value that falls between two listed
// brackets is charged at the next bracket up, same as how an insurer's
// rate card is normally read.

export type InsuranceCustomerType = "individual" | "commercial"

type InsuranceRow = { cifUsd: number; individualUsd: number; commercialUsd: number }

const OCS_INSURANCE_TABLE: InsuranceRow[] = [
  { cifUsd: 100, individualUsd: 0, commercialUsd: 0 },
  { cifUsd: 200, individualUsd: 15, commercialUsd: 15 },
  { cifUsd: 300, individualUsd: 19, commercialUsd: 15 },
  { cifUsd: 400, individualUsd: 23, commercialUsd: 15 },
  { cifUsd: 500, individualUsd: 27, commercialUsd: 15 },
  { cifUsd: 600, individualUsd: 31, commercialUsd: 15 },
  { cifUsd: 700, individualUsd: 35, commercialUsd: 15 },
  { cifUsd: 800, individualUsd: 39, commercialUsd: 15 },
  { cifUsd: 900, individualUsd: 43, commercialUsd: 15 },
  { cifUsd: 1000, individualUsd: 47, commercialUsd: 15 },
  { cifUsd: 1100, individualUsd: 51, commercialUsd: 15 },
  { cifUsd: 1200, individualUsd: 55, commercialUsd: 15 },
  { cifUsd: 1300, individualUsd: 59, commercialUsd: 15 },
  { cifUsd: 1400, individualUsd: 63, commercialUsd: 15 },
  { cifUsd: 1500, individualUsd: 67, commercialUsd: 15 },
  { cifUsd: 1600, individualUsd: 71, commercialUsd: 16 },
  { cifUsd: 1700, individualUsd: 75, commercialUsd: 17 },
  { cifUsd: 1800, individualUsd: 79, commercialUsd: 18 },
  { cifUsd: 1900, individualUsd: 83, commercialUsd: 19 },
  { cifUsd: 2000, individualUsd: 87, commercialUsd: 20 },
  { cifUsd: 2100, individualUsd: 91, commercialUsd: 21 },
  { cifUsd: 2200, individualUsd: 95, commercialUsd: 22 },
  { cifUsd: 2300, individualUsd: 99, commercialUsd: 23 },
  { cifUsd: 2400, individualUsd: 103, commercialUsd: 24 },
  { cifUsd: 2500, individualUsd: 107, commercialUsd: 25 },
  { cifUsd: 2600, individualUsd: 111, commercialUsd: 26 },
  { cifUsd: 2700, individualUsd: 115, commercialUsd: 27 },
  { cifUsd: 2800, individualUsd: 119, commercialUsd: 28 },
  { cifUsd: 2900, individualUsd: 123, commercialUsd: 29 },
  { cifUsd: 3000, individualUsd: 127, commercialUsd: 30 },
  { cifUsd: 3100, individualUsd: 131, commercialUsd: 31 },
  { cifUsd: 3200, individualUsd: 135, commercialUsd: 32 },
  { cifUsd: 3300, individualUsd: 139, commercialUsd: 33 },
  { cifUsd: 3400, individualUsd: 143, commercialUsd: 34 },
  { cifUsd: 3500, individualUsd: 147, commercialUsd: 35 },
  { cifUsd: 3600, individualUsd: 151, commercialUsd: 36 },
  { cifUsd: 3700, individualUsd: 155, commercialUsd: 37 },
  { cifUsd: 3800, individualUsd: 159, commercialUsd: 38 },
  { cifUsd: 3900, individualUsd: 163, commercialUsd: 39 },
  { cifUsd: 4000, individualUsd: 167, commercialUsd: 40 },
  { cifUsd: 4100, individualUsd: 171, commercialUsd: 41 },
  { cifUsd: 4200, individualUsd: 175, commercialUsd: 42 },
  { cifUsd: 4300, individualUsd: 179, commercialUsd: 43 },
  { cifUsd: 4400, individualUsd: 183, commercialUsd: 44 },
  { cifUsd: 4500, individualUsd: 187, commercialUsd: 45 },
  { cifUsd: 4600, individualUsd: 191, commercialUsd: 46 },
  { cifUsd: 4700, individualUsd: 195, commercialUsd: 47 },
  { cifUsd: 4800, individualUsd: 199, commercialUsd: 48 },
  { cifUsd: 4900, individualUsd: 203, commercialUsd: 49 },
  { cifUsd: 5000, individualUsd: 207, commercialUsd: 50 },
  { cifUsd: 5500, individualUsd: 211, commercialUsd: 55 },
  { cifUsd: 6000, individualUsd: 215, commercialUsd: 60 },
  { cifUsd: 6500, individualUsd: 219, commercialUsd: 65 },
  { cifUsd: 7000, individualUsd: 223, commercialUsd: 70 },
  { cifUsd: 7500, individualUsd: 227, commercialUsd: 75 },
  { cifUsd: 8000, individualUsd: 231, commercialUsd: 80 },
  { cifUsd: 8500, individualUsd: 235, commercialUsd: 85 },
  { cifUsd: 9000, individualUsd: 239, commercialUsd: 90 },
  { cifUsd: 9500, individualUsd: 243, commercialUsd: 95 },
  { cifUsd: 10000, individualUsd: 247, commercialUsd: 100 },
]

const MAX_TABLE_CIF_USD = OCS_INSURANCE_TABLE[OCS_INSURANCE_TABLE.length - 1].cifUsd

export type OcsInsuranceEstimate = {
  isFree: boolean
  feeUsd: number
}

// Returns null when the declared value is out of the table's range (the
// caller should show a "contact us" message instead of a number in that
// case, same pattern as the shipping-fee calculator's overweight case).
export function estimateOcsInsurance(
  cifValueUsd: number,
  customerType: InsuranceCustomerType = "individual",
): OcsInsuranceEstimate | null {
  if (!Number.isFinite(cifValueUsd) || cifValueUsd <= 0) return null
  if (cifValueUsd > MAX_TABLE_CIF_USD) return null

  const row = OCS_INSURANCE_TABLE.find((r) => cifValueUsd <= r.cifUsd) ?? OCS_INSURANCE_TABLE[0]
  const feeUsd = customerType === "individual" ? row.individualUsd : row.commercialUsd

  return { isFree: feeUsd === 0, feeUsd }
}

export function isOverOcsInsuranceLimit(cifValueUsd: number): boolean {
  return Number.isFinite(cifValueUsd) && cifValueUsd > MAX_TABLE_CIF_USD
}
