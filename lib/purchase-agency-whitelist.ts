import { createClient } from "@/lib/supabase/server"

// Admin-manageable shopping-site whitelist for the purchase agency
// ("purchase-proxy" / buy-for-me) feature. Restricting which store
// domains a Product URL may point to reduces counterfeit/fraud risk.
// See purchase-agency-whitelist-schema.sql for the underlying table.

export type WhitelistDomain = {
  id: string
  domain: string
  label: string
  enabled: boolean
}

/**
 * Reads the full shopping-site whitelist from
 * public.purchase_agency_whitelist_domains, ordered by label. Falls
 * back to an empty list if the query fails or the table is empty, so
 * a DB hiccup never crashes the admin page or request submission.
 *
 * Server-only: this imports @/lib/supabase/server (next/headers), so
 * it must be called from a Server Component or Server Action and its
 * result passed down as a prop/argument to any client components.
 */
export async function getWhitelistDomains(): Promise<WhitelistDomain[]> {
  try {
    const supabase = await createClient()
    const { data, error } = await supabase
      .from("purchase_agency_whitelist_domains")
      .select("id, domain, label, enabled")
      .order("label", { ascending: true })

    if (error || !data) {
      return []
    }

    return data
  } catch {
    return []
  }
}

/**
 * Pure helper - no server-only imports, safe to unit-test or import
 * from a client-safe module. Returns true if `url`'s hostname exactly
 * matches, or is a subdomain of, any *enabled* domain in `domains`.
 * Never throws: a malformed URL is treated as not whitelisted rather
 * than crashing request submission.
 */
export function isUrlWhitelisted(
  url: string,
  domains: { domain: string; enabled: boolean }[],
): boolean {
  try {
    const hostname = new URL(url).hostname.toLowerCase().replace(/^www\./, "")
    return domains.some(
      (d) =>
        d.enabled &&
        (hostname === d.domain || hostname.endsWith(`.${d.domain}`)),
    )
  } catch {
    return false
  }
}
