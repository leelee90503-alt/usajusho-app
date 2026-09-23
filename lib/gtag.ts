// Thin wrapper around the global gtag.js loaded by <GoogleAnalytics /> in the
// root layout. Every call is a no-op when the measurement ID isn't
// configured (local dev, PR previews without the env var, etc.) or when
// gtag.js hasn't finished loading yet, so callers never need to guard.

export const GA_MEASUREMENT_ID = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID

/**
 * Google Ads conversion tag ID (format "AW-XXXXXXXXX"), separate from the
 * GA4 measurement ID above. Loaded alongside GA4 in <GoogleAnalytics /> so
 * both products get pageviews.
 */
export const GOOGLE_ADS_ID = process.env.NEXT_PUBLIC_GOOGLE_ADS_ID

/**
 * Per-event Google Ads conversion action labels, from the "Sign-up" and
 * "Submit lead form" conversion actions created in the Ads UI (Manually
 * with code). Kept separate from GOOGLE_ADS_ID so only the label needs to
 * change if a conversion action is ever recreated; "Purchase" isn't listed
 * here because it's tracked as a Google Ads conversion goal automatically
 * imported from the linked GA4 property's `purchase` key event, not by a
 * dedicated code-side conversion label.
 */
const ADS_CONVERSION_LABELS = {
  signUp: "4j_ZCITr6IEdEMSU1-BE",
  generateLead: "rkD3CIfr6IEdEMSU1-BE",
} as const

/**
 * Fires a Google Ads conversion event (distinct from the GA4 event above)
 * so the action shows up as real Ads conversion data for Smart Bidding,
 * not just as a GA4 event. No-op when GOOGLE_ADS_ID isn't configured.
 */
function trackAdsConversion(label: string) {
  if (!GOOGLE_ADS_ID) return
  gtag("event", "conversion", { send_to: `${GOOGLE_ADS_ID}/${label}` })
}

declare global {
  interface Window {
    dataLayer?: unknown[]
    gtag?: (...args: unknown[]) => void
  }
}

function gtag(...args: unknown[]) {
  if (typeof window === "undefined" || typeof window.gtag !== "function") return
  window.gtag(...args)
}

/** Fires on every client-side route change (App Router doesn't do this on its own). */
export function pageview(url: string) {
  if (!GA_MEASUREMENT_ID) return
  gtag("config", GA_MEASUREMENT_ID, { page_path: url })
}

/**
 * GA4 recommended event: a new account was created. Also fires the
 * "Sign-up" Google Ads conversion action (see ADS_CONVERSION_LABELS above).
 */
export function trackSignUp() {
  gtag("event", "sign_up", { method: "email" })
  trackAdsConversion(ADS_CONVERSION_LABELS.signUp)
}

/**
 * GA4 recommended event: a lead-style request (not yet paid) was submitted.
 * Used for purchase-agency requests, which turn into revenue only once
 * quoted and paid. Also fires the "Submit lead form" Google Ads conversion
 * action (see ADS_CONVERSION_LABELS above).
 */
export function trackGenerateLead(params?: { content_type?: string }) {
  gtag("event", "generate_lead", params)
  trackAdsConversion(ADS_CONVERSION_LABELS.generateLead)
}

/**
 * GA4 recommended event: a real payment went through Square. `transactionType`
 * distinguishes a shipment payment from a purchase-agency payment so they
 * can be reported separately in GA4/Ads if needed.
 */
export function trackPurchase(params: {
  transactionId: string
  value: number
  transactionType: "shipment" | "purchase_agency"
}) {
  gtag("event", "purchase", {
    transaction_id: params.transactionId,
    value: params.value,
    currency: "USD",
    transaction_type: params.transactionType,
  })
}
