"use client"

import { Suspense, useEffect } from "react"
import Script from "next/script"
import { usePathname, useSearchParams } from "next/navigation"
import { GA_MEASUREMENT_ID, GOOGLE_ADS_ID, pageview } from "@/lib/gtag"

function PageviewTracker() {
  const pathname = usePathname()
  const searchParams = useSearchParams()

  useEffect(() => {
    if (!GA_MEASUREMENT_ID) return
    const query = searchParams.toString()
    pageview(query ? `${pathname}?${query}` : pathname)
  }, [pathname, searchParams])

  return null
}

/**
 * Loads gtag.js and wires up GA4 pageview tracking on client-side route
 * changes (the App Router doesn't fire a native pageview for those).
 * Renders nothing when NEXT_PUBLIC_GA_MEASUREMENT_ID isn't set, so it's
 * safe to keep mounted in every environment (local dev, PR previews, etc.).
 */
export default function GoogleAnalytics() {
  if (!GA_MEASUREMENT_ID && !GOOGLE_ADS_ID) return null

  // Either ID can load gtag.js; prefer GA4's since it's the one wired up to
  // the custom events in lib/gtag.ts.
  const loaderId = GA_MEASUREMENT_ID ?? GOOGLE_ADS_ID

  return (
    <>
      <Script
        src={`https://www.googletagmanager.com/gtag/js?id=${loaderId}`}
        strategy="afterInteractive"
      />
      <Script id="ga-init" strategy="afterInteractive">
        {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());
          ${GA_MEASUREMENT_ID ? `gtag('config', '${GA_MEASUREMENT_ID}');` : ""}
          ${GOOGLE_ADS_ID ? `gtag('config', '${GOOGLE_ADS_ID}');` : ""}
        `}
      </Script>
      {GA_MEASUREMENT_ID && (
        <Suspense fallback={null}>
          <PageviewTracker />
        </Suspense>
      )}
    </>
  )
}
