// Fee structure for the purchase-agency ("purchase-proxy" / buy-for-me)
// service: a flat base fee plus a percentage of the item price.
//
// The two numbers are admin-configurable, stored in the singleton
// public.purchase_agency_settings row (see
// purchase-agency-settings-schema.sql). This file has no server-only
// imports (no @/lib/supabase/server, no next/headers) so it can be
// safely imported from client components like request-row.tsx.
// getPurchaseAgencyFeeSettings(), which reads the DB, lives in
// lib/purchase-agency-settings.ts instead and is called server-side,
// with the result passed down as a prop/argument.
export const PURCHASE_AGENCY_FLAT_FEE_CENTS = 600 // $6.00 flat fee per request
export const PURCHASE_AGENCY_PERCENT_FEE = 0.07 // 7% of the item price

export type PurchaseAgencyFeeSettings = {
  flatFeeCents: number
  feePercent: number
}

export const DEFAULT_PURCHASE_AGENCY_FEE_SETTINGS: PurchaseAgencyFeeSettings = {
  flatFeeCents: PURCHASE_AGENCY_FLAT_FEE_CENTS,
  feePercent: PURCHASE_AGENCY_PERCENT_FEE,
}

export type PurchaseAgencyFeeEstimate = {
  itemPriceCents: number
  feeCents: number
  totalCents: number
}

/**
 * Suggests a fee (flat + percentage of item price) for an admin writing a
 * quote. This is only a starting suggestion - admins can override the fee
 * and total when they send the quote.
 *
 * `settings` defaults to the hardcoded fallback values but should
 * normally be the live values from getPurchaseAgencyFeeSettings()
 * (lib/purchase-agency-settings.ts), fetched server-side and passed
 * down to the caller (this function itself stays a plain sync helper
 * with no server-only imports so it can run in client components).
 */
export function estimatePurchaseAgencyFee(
  itemPriceCents: number,
  settings: PurchaseAgencyFeeSettings = DEFAULT_PURCHASE_AGENCY_FEE_SETTINGS,
): PurchaseAgencyFeeEstimate {
  const percentFee = Math.round(itemPriceCents * settings.feePercent)
  const feeCents = settings.flatFeeCents + percentFee
  return {
    itemPriceCents,
    feeCents,
    totalCents: itemPriceCents + feeCents,
  }
}
