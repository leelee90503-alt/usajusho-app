// Shipping cost calculation helpers.
//
// The chargeable weight for a package is the greater of its actual weight
// and its volumetric (dimensional) weight -- the standard air-freight
// convention used by DHL/FedEx/UPS. Volumetric weight in kg is
// (length_cm * width_cm * height_cm) / 5000.
//
// Once we know the chargeable weight, we look it up against the tiered
// shipping_rates table (min_weight_kg inclusive, max_weight_kg exclusive;
// a null max_weight_kg means "and above") and multiply by price_per_kg,
// applying the tier's min_charge as a floor.

export type ShippingRate = {
  id: string
  label: string
  min_weight_kg: number
  max_weight_kg: number | null
  price_per_kg: number
  min_charge: number
  is_active: boolean
  sort_order: number
}

export type ChargeableWeightInput = {
  weightKg: number | null | undefined
  lengthCm: number | null | undefined
  widthCm: number | null | undefined
  heightCm: number | null | undefined
}

export type ChargeableWeightResult = {
  actualWeightKg: number
  volumetricWeightKg: number
  chargeableWeightKg: number
}

const VOLUMETRIC_DIVISOR = 6000

export function calculateVolumetricWeightKg(
  lengthCm: number | null | undefined,
  widthCm: number | null | undefined,
  heightCm: number | null | undefined,
): number {
  if (!lengthCm || !widthCm || !heightCm) return 0
  if (lengthCm <= 0 || widthCm <= 0 || heightCm <= 0) return 0
  return (lengthCm * widthCm * heightCm) / VOLUMETRIC_DIVISOR
}

export function calculateChargeableWeight(
  input: ChargeableWeightInput,
): ChargeableWeightResult {
  const actualWeightKg = input.weightKg && input.weightKg > 0 ? input.weightKg : 0
  const volumetricWeightKg = calculateVolumetricWeightKg(
    input.lengthCm,
    input.widthCm,
    input.heightCm,
  )
  const chargeableWeightKg = Math.max(actualWeightKg, volumetricWeightKg)

  return {
    actualWeightKg,
    volumetricWeightKg: round2(volumetricWeightKg),
    chargeableWeightKg: round2(chargeableWeightKg),
  }
}

export function findRateForWeight(
  rates: ShippingRate[],
  chargeableWeightKg: number,
): ShippingRate | null {
  const active = rates
    .filter((r) => r.is_active)
    .sort((a, b) => a.min_weight_kg - b.min_weight_kg)

  for (const rate of active) {
      // Tiers are (min, max] so a weight exactly on an integer boundary (e.g. 3.0kg)
      // bills at that tier's rate (ceiling billing), not the next tier up. The very
      // first tier (min_weight_kg === 0) stays inclusive of 0 itself.
      const withinMin = rate.min_weight_kg === 0
        ? chargeableWeightKg >= rate.min_weight_kg
        : chargeableWeightKg > rate.min_weight_kg
      const withinMax = rate.max_weight_kg === null || chargeableWeightKg <= rate.max_weight_kg
      if (withinMin && withinMax) {
        return rate
      }
    }

  return null
}

export type QuoteEstimate = {
  actualWeightKg: number
  volumetricWeightKg: number
  chargeableWeightKg: number
  rate: ShippingRate | null
  amount: number | null
}

export function estimateQuote(
  input: ChargeableWeightInput,
  rates: ShippingRate[],
): QuoteEstimate {
  const weight = calculateChargeableWeight(input)
  const rate = findRateForWeight(rates, weight.chargeableWeightKg)

  if (!rate) {
    return { ...weight, rate: null, amount: null }
  }

  const raw = weight.chargeableWeightKg * rate.price_per_kg
  const amount = Math.max(Math.round(raw), rate.min_charge)

  return { ...weight, rate, amount }
}

function round2(value: number): number {
  return Math.round(value * 100) / 100
}
