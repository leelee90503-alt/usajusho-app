// Fee structure for the purchase-agency ("purchase-proxy" / buy-for-me)
// service: a flat base fee plus a percentage of the item price.
//
// The two numbers are admin-configurable, stored in the singleton
// public.purchase_agency_settings row (see
// purchase-agency-settings-schema.sql). getPurchaseAgencyFeeSettings()
// reads them from the DB; the constants below are only a fallback used
// if that row is somehow missing, so quote-writing never crashes.
import { createClient } from "@/lib/supabase/server"

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

/**
 * Reads the current flat fee + percent fee from
 * public.purchase_agency_settings (id = 1). Falls back to the
 * hardcoded defaults above if the row is missing or the query fails,
 * so admin quote-writing never crashes because settings aren't seeded.
 */
export async function getPurchaseAgencyFeeSettings(): Promise<PurchaseAgencyFeeSettings> {
  try {
    const supabase = await createClient()
    const { data, error } = await supabase
      .from("purchase_agency_settings")
      .select("flat_fee_cents, fee_percent")
      .eq("id", 1)
      .maybeSingle()

    if (error || !data) {
      return DEFAULT_PURCHASE_AGENCY_FEE_SETTINGS
    }

    return {
      flatFeeCents: data.flat_fee_cents,
      feePercent: Number(data.fee_percent) / 100,
    }
  } catch {
    return DEFAULT_PURCHASE_AGENCY_FEE_SETTINGS
  }
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
 * normally be the live values from getPurchaseAgencyFeeSettings(),
 * fetched server-side and passed down to the caller (this function
 * itself stays a plain sync helper so it can run in client components).
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
