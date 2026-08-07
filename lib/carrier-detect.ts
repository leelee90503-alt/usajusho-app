export type CarrierMatch = {
  carrier: string
  trackingUrl: string
}

// Best-effort carrier detection from the *shape* of a tracking number. This
// is a heuristic, not an authoritative lookup - we don't call any carrier or
// aggregator API, so there's no account/API key to manage and no per-lookup
// cost. Some formats genuinely overlap between carriers (e.g. FedEx Ground
// and USPS both issue plain 20-22 digit numbers), so a match here is a
// strong guess intended to save a click, not a guarantee. When nothing
// matches, callers should fall back to fallbackTrackingUrl() so there's
// still something useful to click.
export function detectCarrier(raw: string): CarrierMatch | null {
  const num = raw.trim().toUpperCase().replace(/[\s-]/g, "")
  if (!num) return null

  // UPS: "1Z" + 6-char shipper id + 2-char service + 8-digit serial (18 chars total).
  if (/^1Z[0-9A-Z]{16}$/.test(num)) {
    return {
      carrier: "UPS",
      trackingUrl: `https://www.ups.com/track?loc=en_US&tracknum=${num}`,
    }
  }

  // Amazon Logistics: "TBA" + 12 digits.
  if (/^TBA\d{12}$/.test(num)) {
    return {
      carrier: "Amazon Logistics",
      trackingUrl: `https://track.amazon.com/tracking/${num}`,
    }
  }

  // UPU S10 international postal format: 2 letters + 9 digits + 2-letter
  // country code (e.g. RR123456785US, EE123456785JP). Used by USPS, Japan
  // Post, China Post, and most national postal operators for international
  // mail/EMS.
  const s10 = num.match(/^([A-Z]{2})(\d{9})([A-Z]{2})$/)
  if (s10) {
    const country = s10[3]
    if (country === "US") {
      return {
        carrier: "USPS",
        trackingUrl: `https://tools.usps.com/go/TrackConfirmAction?tLabels=${num}`,
      }
    }
    if (country === "JP") {
      return {
        carrier: "Japan Post",
        trackingUrl: `https://trackings.post.japanpost.jp/services/srv/search/?requestNo1=${num}&locale=en`,
      }
    }
    return {
      carrier: `International Post (${country})`,
      trackingUrl: fallbackTrackingUrl(num),
    }
  }

  // USPS domestic: 20-22 digit numeric starting with a known USPS service prefix.
  const USPS_PREFIXES = [
    "9205", "9207", "9214", "9270", "9271",
    "9302", "9303", "9400", "9401", "9403", "9404", "9407", "9470",
  ]
  if (/^\d{20,22}$/.test(num) && USPS_PREFIXES.some((p) => num.startsWith(p))) {
    return {
      carrier: "USPS",
      trackingUrl: `https://tools.usps.com/go/TrackConfirmAction?tLabels=${num}`,
    }
  }

  // DHL Express: 10-digit numeric (checked before the FedEx numeric ranges below).
  if (/^\d{10}$/.test(num)) {
    return {
      carrier: "DHL Express",
      trackingUrl: `https://www.dhl.com/us-en/home/tracking.html?tracking-id=${num}`,
    }
  }

  // FedEx: 12, 15, or 20-22 digit numeric. Checked last among the numeric
  // formats since it's the least specific (catches whatever the USPS-prefix
  // check above didn't).
  if (/^\d{12}$/.test(num) || /^\d{15}$/.test(num) || /^\d{20,22}$/.test(num)) {
    return {
      carrier: "FedEx",
      trackingUrl: `https://www.fedex.com/fedextrack/?trknbr=${num}`,
    }
  }

  return null
}

// A free, no-login multi-carrier search page to fall back to when the
// tracking number's format isn't recognized at all, so there's still
// something useful to click instead of a dead end.
export function fallbackTrackingUrl(raw: string): string {
  const num = raw.trim().toUpperCase().replace(/[\s-]/g, "")
  return `https://t.17track.net/en#nums=${encodeURIComponent(num)}`
}
