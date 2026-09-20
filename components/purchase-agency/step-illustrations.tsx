type IconProps = { className?: string }

/**
 * Custom inline-SVG "scene" illustrations for the /purchase-agency page,
 * matching the same navy/teal line-art style as
 * components/how-it-works/step-illustrations.tsx (used on /forwarding).
 * Drawn in code rather than sourced as photos so the six purchase-agency
 * steps get their own accurate, numeral-free artwork instead of reusing
 * /forwarding's photos, which have step numbers and captions baked in
 * for a different, seven-step sequence.
 */

export function RequestArt({ className }: IconProps) {
  return (
    <svg viewBox="0 0 200 160" className={className} aria-hidden="true">
      <rect width="200" height="160" rx="16" fill="var(--usj-surface)" />
      <rect x="46" y="46" width="108" height="72" rx="8" fill="none" stroke="var(--usj-primary)" strokeWidth="3" />
      <line x1="46" y1="64" x2="154" y2="64" stroke="var(--usj-primary)" strokeWidth="3" />
      <circle cx="56" cy="55" r="2.5" fill="var(--usj-primary)" />
      <circle cx="64" cy="55" r="2.5" fill="var(--usj-primary)" />
      <path
        d="M62 90 L84 90 M62 90 L70 82 M62 90 L70 98"
        stroke="var(--usj-accent)"
        strokeWidth="3"
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <rect x="92" y="80" width="46" height="20" rx="4" fill="none" stroke="var(--usj-primary)" strokeWidth="2.5" />
      <g transform="translate(148,32)">
        <circle r="16" fill="var(--usj-accent)" />
        <path d="M0 -8 L2 -2 L8 0 L2 2 L0 8 L-2 2 L-8 0 L-2 -2 Z" fill="white" />
      </g>
    </svg>
  )
}

export function QuoteArt({ className }: IconProps) {
  return (
    <svg viewBox="0 0 200 160" className={className} aria-hidden="true">
      <rect width="200" height="160" rx="16" fill="var(--usj-surface)" />
      <rect x="58" y="34" width="72" height="96" rx="6" fill="none" stroke="var(--usj-primary)" strokeWidth="3" />
      <path d="M70 54h48M70 68h48M70 82h30" stroke="var(--usj-primary)" strokeWidth="2.5" strokeLinecap="round" />
      <text
        x="94"
        y="112"
        textAnchor="middle"
        fontSize="20"
        fontWeight="700"
        fill="var(--usj-primary)"
        fontFamily="sans-serif"
      >
        $
      </text>
      <g transform="translate(140,118)">
        <circle r="18" fill="var(--usj-accent)" />
        <path d="M-8 0 L-2 6 L9 -7" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
      </g>
    </svg>
  )
}

export function PaymentArt({ className }: IconProps) {
  return (
    <svg viewBox="0 0 200 160" className={className} aria-hidden="true">
      <rect width="200" height="160" rx="16" fill="var(--usj-surface)" />
      <rect x="44" y="56" width="72" height="48" rx="7" fill="none" stroke="var(--usj-primary)" strokeWidth="3" />
      <rect x="44" y="68" width="72" height="10" fill="var(--usj-primary)" opacity="0.85" />
      <line x1="52" y1="92" x2="76" y2="92" stroke="var(--usj-primary)" strokeWidth="2.5" strokeLinecap="round" />
      <g transform="translate(140,80)">
        <circle r="26" fill="none" stroke="var(--usj-primary)" strokeWidth="3" />
        <rect x="-9" y="-2" width="18" height="14" rx="2" fill="none" stroke="var(--usj-primary)" strokeWidth="2.5" />
        <path d="M-5 -2 v-5 a5 5 0 0 1 10 0 v5" fill="none" stroke="var(--usj-primary)" strokeWidth="2.5" />
      </g>
      <g transform="translate(148,32)">
        <circle r="16" fill="var(--usj-accent)" />
        <path d="M-8 0 L-2 6 L9 -7" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
      </g>
    </svg>
  )
}

export function PurchaseArt({ className }: IconProps) {
  return (
    <svg viewBox="0 0 200 160" className={className} aria-hidden="true">
      <rect width="200" height="160" rx="16" fill="var(--usj-surface)" />
      <path d="M52 66 h72 l-8 46 h-56 z" fill="none" stroke="var(--usj-primary)" strokeWidth="3" strokeLinejoin="round" />
      <path d="M66 66 v-8 a22 22 0 0 1 44 0 v8" fill="none" stroke="var(--usj-primary)" strokeWidth="3" strokeLinecap="round" />
      <circle cx="80" cy="94" r="2.5" fill="var(--usj-primary)" />
      <circle cx="104" cy="94" r="2.5" fill="var(--usj-primary)" />
      <g transform="translate(146,108)">
        <circle r="18" fill="var(--usj-accent)" />
        <path d="M-8 0 L-2 6 L9 -7" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
      </g>
    </svg>
  )
}

export function InspectArt({ className }: IconProps) {
  return (
    <svg viewBox="0 0 200 160" className={className} aria-hidden="true">
      <rect width="200" height="160" rx="16" fill="var(--usj-surface)" />
      <rect x="40" y="94" width="48" height="40" rx="4" fill="none" stroke="var(--usj-primary)" strokeWidth="3" />
      <path d="M40 108 h48 M64 94 v40" stroke="var(--usj-primary)" strokeWidth="2" />
      <g transform="translate(128,72)">
        <circle r="24" fill="none" stroke="var(--usj-primary)" strokeWidth="3" />
        <rect x="-11" y="-7" width="22" height="16" rx="2" fill="none" stroke="var(--usj-primary)" strokeWidth="2.5" />
        <circle cx="0" cy="1" r="5" fill="none" stroke="var(--usj-primary)" strokeWidth="2.5" />
      </g>
      <g transform="translate(150,110)">
        <circle r="16" fill="var(--usj-accent)" />
        <path d="M0 -8 L2 -2 L8 0 L2 2 L0 8 L-2 2 L-8 0 L-2 -2 Z" fill="white" />
      </g>
    </svg>
  )
}

export function ShipJapanArt({ className }: IconProps) {
  return (
    <svg viewBox="0 0 200 160" className={className} aria-hidden="true">
      <rect width="200" height="160" rx="16" fill="var(--usj-surface)" />
      <rect x="40" y="90" width="46" height="40" rx="4" fill="none" stroke="var(--usj-primary)" strokeWidth="3" />
      <path d="M40 104 h46 M63 90 v40" stroke="var(--usj-primary)" strokeWidth="2" />
      <path d="M90 96 Q128 44 162 68" fill="none" stroke="var(--usj-accent)" strokeWidth="2.5" strokeDasharray="6 6" strokeLinecap="round" />
      <g transform="translate(162,62) rotate(20)">
        <path d="M0 -14 L14 8 L0 3 L-14 8 Z" fill="var(--usj-primary)" />
      </g>
      <circle cx="150" cy="112" r="18" fill="none" stroke="var(--usj-primary)" strokeWidth="2.5" />
      <path
        d="M144 106 q6 6 0 12 M156 106 q-6 6 0 12"
        stroke="var(--usj-primary)"
        strokeWidth="2"
        fill="none"
        opacity="0.7"
      />
    </svg>
  )
}
