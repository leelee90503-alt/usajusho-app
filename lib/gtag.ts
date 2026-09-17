// Thin wrapper around the global gtag.js loaded by <GoogleAnalytics /> in the
// root layout. Every call is a no-op when the measurement ID isn't
// configured (local dev, PR previews without the env var, etc.) or when
// gtag.js hasn't finished loading yet, so callers never need to guard.

export const GA_MEASUREMENT_ID = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID

/**
 * Google Ads conversion tag ID (format "AW-XXXXXXXXX"), separate from the
 * GA4 measurement ID above. Loaded alongside GA4 in <GoogleAnalytics /> so
 * both products get pageviews; conversions are still fired through the
 * GA4 events below once GA4 is linked to this Ads account, or Ads-specific
 * conversion actions can be added later without touching this file.
 */
export const GOOGLE_ADS_ID = process.env.NEXT_PUBLIC_GOOGLE_ADS_ID

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
 * GA4 recommended event: a new account was created. Once GA4 is linked to
 * Google Ads, mark this event as a conversion in the Ads UI -- no code
 * change needed to start counting it as an ad conversion.
 */
export function trackSignUp() {
  gtag("event", "sign_up", { method: "email" })
}

/**
 * GA4 recommended event: a lead-style request (not yet paid) was submitted.
 * Used for purchase-agency requests, which turn into revenue only once
 * quoted and paid.
 */
export function trackGenerateLead(params?: { content_type?: string }) {
  gtag("event", "generate_lead", params)
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
