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
