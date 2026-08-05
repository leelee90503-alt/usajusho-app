// Fee structure for the purchase-agency ("purchase-proxy" / buy-for-me)
// service: a flat base fee plus a percentage of the item price.
//
// PLACEHOLDER VALUES - these are illustrative defaults, not final business
// numbers. Tune them freely; nothing else in the app hardcodes these, so
// changing the constants below is enough. If/when this needs to be
// admin-configurable (like shipping_rates in /admin/pricing), promote this
// into a DB-backed settings table following that same pattern.
export const PURCHASE_AGENCY_FLAT_FEE_CENTS = 600 // $6.00 flat fee per request
export const PURCHASE_AGENCY_PERCENT_FEE = 0.07 // 7% of the item price

export type PurchaseAgencyFeeEstimate = {
  itemPriceCents: number
  feeCents: number
  totalCents: number
}

/**
 * Suggests a fee (flat + percentage of item price) for an admin writing a
 * quote. This is only a starting suggestion - admins can override the fee
 * and total when they send the quote.
 */
export function estimatePurchaseAgencyFee(
  itemPriceCents: number,
): PurchaseAgencyFeeEstimate {
  const percentFee = Math.round(itemPriceCents * PURCHASE_AGENCY_PERCENT_FEE)
  const feeCents = PURCHASE_AGENCY_FLAT_FEE_CENTS + percentFee
  return {
    itemPriceCents,
    feeCents,
    totalCents: itemPriceCents + feeCents,
  }
}
