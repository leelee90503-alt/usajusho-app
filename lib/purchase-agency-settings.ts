import { createClient } from "@/lib/supabase/server"
import {
  DEFAULT_PURCHASE_AGENCY_FEE_SETTINGS,
  type PurchaseAgencyFeeSettings,
} from "@/lib/purchase-agency-pricing"

/**
 * Reads the current flat fee + percent fee from
 * public.purchase_agency_settings (id = 1). Falls back to the
 * hardcoded defaults in lib/purchase-agency-pricing.ts if the row is
 * missing or the query fails, so admin quote-writing never crashes
 * because settings aren't seeded.
 *
 * Server-only: this imports @/lib/supabase/server (next/headers), so
 * it must be called from a Server Component or Server Action and its
 * result passed down as a prop/argument to any client components.
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

/**
 * Public counterpart to getPurchaseAgencyFeeSettings(), for anonymous
 * visitors -- e.g. the public /purchase-agency marketing page, which
 * explains the fee structure before a guest has signed up or logged in.
 *
 * public.purchase_agency_settings only grants SELECT to authenticated
 * users (see purchase-agency-settings-schema.sql), so an anon read of
 * that table returns no row. This instead reads
 * public.purchase_agency_public_fee_settings, a narrow view that
 * exposes only flat_fee_cents/fee_percent (never square_mode) and
 * bypasses the base table's RLS for anon/authenticated readers alike --
 * see purchase-agency-public-fee-view-migration.sql for how and why.
 *
 * Same fallback behavior as getPurchaseAgencyFeeSettings(): any error
 * or missing row silently resolves to the hardcoded defaults, so the
 * marketing page never breaks because settings aren't seeded.
 */
export async function getPurchaseAgencyPublicFeeSettings(): Promise<PurchaseAgencyFeeSettings> {
  try {
    const supabase = await createClient()
    const { data, error } = await supabase
      .from("purchase_agency_public_fee_settings")
      .select("flat_fee_cents, fee_percent")
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
