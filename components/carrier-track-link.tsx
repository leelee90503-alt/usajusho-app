'use client'

import { useMemo } from "react"
import { useTranslations } from "next-intl"
import { detectCarrier, fallbackTrackingUrl } from "@/lib/carrier-detect"
import { ExternalLink } from "lucide-react"

// Shows the auto-detected carrier for a tracking number as a link straight
// to that carrier's own tracking page (number pre-filled in the URL where
// the carrier supports it). If the number's format isn't recognized, falls
// back to a free multi-carrier search page instead of showing nothing.
// Renders nothing when there's no tracking number to check yet.
export default function CarrierTrackLink({
  trackingNumber,
  className,
}: {
  trackingNumber: string | null | undefined
  className?: string
}) {
  const t = useTranslations("carrierTrack")
  const match = useMemo(
    () => (trackingNumber?.trim() ? detectCarrier(trackingNumber) : null),
    [trackingNumber],
  )

  if (!trackingNumber?.trim()) return null

  const href = match ? match.trackingUrl : fallbackTrackingUrl(trackingNumber)
  const label = match ? t("detectedCarrier", { carrier: match.carrier }) : t("unknownCarrier")

  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      className={`inline-flex items-center gap-1 text-accent underline underline-offset-2 hover:opacity-80 ${className ?? ""}`}
    >
      {label}
      <ExternalLink className="h-3 w-3" />
    </a>
  )
}
