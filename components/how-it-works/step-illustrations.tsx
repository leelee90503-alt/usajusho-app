type IconProps = { className?: string }

/**
 * Custom inline-SVG "scene" illustrations for the /how-it-works page.
 * Same no-stock-art philosophy as components/home/delivery-journey.tsx:
 * each step gets a small drawn scene (not a generic icon) in the
 * USAJUSHO navy / teal palette, plus a small accent-colored badge.
 */

export function SignupArt({ className }: IconProps) {
  return (
    <svg viewBox="0 0 200 160" className={className} aria-hidden="true">
      <rect width="200" height="160" rx="16" fill="var(--usj-surface)" />
      <path
        d="M100 40 C76 40 58 58 58 82 C58 108 100 130 100 130 C100 130 142 108 142 82 C142 58 124 40 100 40Z"
        fill="none"
        stroke="var(--usj-primary)"
        strokeWidth="3"
      />
      <circle cx="100" cy="80" r="18" fill="none" stroke="var(--usj-primary)" strokeWidth="3" />
      <path
        d="M92 82 L100 74 L108 82 M94 82 V90 H106 V82"
        stroke="var(--usj-primary)"
        strokeWidth="2.5"
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <g transform="translate(148,32)">
        <circle r="16" fill="var(--usj-accent)" />
        <path d="M0 -8 L2 -2 L8 0 L2 2 L0 8 L-2 2 L-8 0 L-2 -2 Z" fill="white" />
      </g>
    </svg>
  )
}

export function ShopArt({ className }: IconProps) {
  return (
    <svg viewBox="0 0 200 160" className={className} aria-hidden="true">
      <rect width="200" height="160" rx="16" fill="var(--usj-surface)" />
      <rect x="40" y="36" width="120" height="88" rx="8" fill="none" stroke="var(--usj-primary)" strokeWidth="3" />
      <line x1="40" y1="54" x2="160" y2="54" stroke="var(--usj-primary)" strokeWidth="3" />
      <circle cx="50" cy="45" r="2.5" fill="var(--usj-primary)" />
      <circle cx="58" cy="45" r="2.5" fill="var(--usj-primary)" />
      <circle cx="66" cy="45" r="2.5" fill="var(--usj-primary)" />
      <path d="M84 74 h32 l4 36 h-40 z" fill="none" stroke="var(--usj-primary)" strokeWidth="3" strokeLinejoin="round" />
      <path d="M92 74 v-6 a8 8 0 0 1 16 0 v6" fill="none" stroke="var(--usj-primary)" strokeWidth="3" strokeLinecap="round" />
      <g transform="translate(150,122)">
        <circle r="16" fill="var(--usj-accent)" />
        <path d="M-5 -7 L6 0 L1 1 L4 8 L1 9 L-2 2 L-5 6 Z" fill="white" />
      </g>
    </svg>
  )
}

export function DeclareArt({ className }: IconProps) {
  return (
    <svg viewBox="0 0 200 160" className={className} aria-hidden="true">
      <rect width="200" height="160" rx="16" fill="var(--usj-surface)" />
      <path
        d="M70 30h60v96l-10-7-10 7-10-7-10 7-10-7-10 7V30z"
        fill="none"
        stroke="var(--usj-primary)"
        strokeWidth="3"
        strokeLinejoin="round"
      />
      <path d="M82 50h36M82 64h36M82 78h20" stroke="var(--usj-primary)" strokeWidth="3" strokeLinecap="round" />
      <g transform="translate(148,116)">
        <circle r="18" fill="var(--usj-accent)" />
        <path d="M-8 0 L-2 6 L9 -7" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
      </g>
    </svg>
  )
}

export function WarehouseArt({ className }: IconProps) {
  return (
    <svg viewBox="0 0 200 160" className={className} aria-hidden="true">
      <rect width="200" height="160" rx="16" fill="var(--usj-surface)" />
      <path
        d="M60 78 L100 62 L140 78 L140 118 L100 134 L60 118 Z"
        fill="none"
        stroke="var(--usj-primary)"
        strokeWidth="3"
        strokeLinejoin="round"
      />
      <path d="M60 78 L100 94 L140 78 M100 94 V134" stroke="var(--usj-primary)" strokeWidth="3" fill="none" strokeLinejoin="round" />
      <path d="M78 70 L100 62 L100 94 L60 78 Z" fill="none" stroke="var(--usj-primary)" strokeWidth="2" opacity="0.5" />
      <g transform="translate(148,40)">
        <circle r="18" fill="var(--usj-accent)" />
        <rect x="-10" y="-6" width="20" height="14" rx="2" fill="none" stroke="white" strokeWidth="2" />
        <circle cx="0" cy="1" r="4.5" fill="none" stroke="white" strokeWidth="2" />
        <rect x="-4" y="-9" width="8" height="4" rx="1" fill="white" />
      </g>
    </svg>
  )
}

export function ConsolidateArt({ className }: IconProps) {
  return (
    <svg viewBox="0 0 200 160" className={className} aria-hidden="true">
      <rect width="200" height="160" rx="16" fill="var(--usj-surface)" />
      <rect x="34" y="50" width="24" height="24" rx="3" fill="none" stroke="var(--usj-primary)" strokeWidth="2.5" opacity="0.6" />
      <rect x="34" y="82" width="24" height="24" rx="3" fill="none" stroke="var(--usj-primary)" strokeWidth="2.5" opacity="0.6" />
      <rect x="34" y="114" width="24" height="18" rx="3" fill="none" stroke="var(--usj-primary)" strokeWidth="2.5" opacity="0.6" />
      <path d="M70 90 h24" stroke="var(--usj-primary)" strokeWidth="3" strokeLinecap="round" />
      <path d="M88 82 L100 90 L88 98" fill="none" stroke="var(--usj-primary)" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
      <rect x="112" y="60" width="56" height="56" rx="5" fill="none" stroke="var(--usj-primary)" strokeWidth="3.5" />
      <path d="M112 78 h56 M140 60 v56" stroke="var(--usj-primary)" strokeWidth="2.5" />
      <g transform="translate(150,132)">
        <circle r="16" fill="var(--usj-accent)" />
        <path d="M-6 -8 h12 v16 l-2 -2 l-2 2 l-2 -2 l-2 2 l-2 -2 l-2 2 z" fill="white" />
      </g>
    </svg>
  )
}

export function ShipArt({ className }: IconProps) {
  return (
    <svg viewBox="0 0 200 160" className={className} aria-hidden="true">
      <rect width="200" height="160" rx="16" fill="var(--usj-surface)" />
      <rect x="40" y="94" width="48" height="42" rx="4" fill="none" stroke="var(--usj-primary)" strokeWidth="3" />
      <path d="M40 108 h48 M64 94 v42" stroke="var(--usj-primary)" strokeWidth="2" />
      <path d="M90 100 Q130 40 165 70" fill="none" stroke="var(--usj-accent)" strokeWidth="2.5" strokeDasharray="6 6" strokeLinecap="round" />
      <g transform="translate(165,64) rotate(20)">
        <path d="M0 -14 L14 8 L0 3 L-14 8 Z" fill="var(--usj-primary)" />
      </g>
    </svg>
  )
}

export function DeliveredArt({ className }: IconProps) {
  return (
    <svg viewBox="0 0 200 160" className={className} aria-hidden="true">
      <rect width="200" height="160" rx="16" fill="var(--usj-surface)" />
      <path d="M60 92 L100 60 L140 92" fill="none" stroke="var(--usj-primary)" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M68 86 V128 H132 V86" fill="none" stroke="var(--usj-primary)" strokeWidth="3.5" strokeLinejoin="round" />
      <rect x="92" y="104" width="16" height="24" fill="none" stroke="var(--usj-primary)" strokeWidth="2.5" />
      <rect x="108" y="112" width="18" height="16" rx="2" fill="none" stroke="var(--usj-primary)" strokeWidth="2.5" />
      <g transform="translate(150,50)">
        <circle r="16" fill="var(--usj-accent)" />
        <path d="M-7 0 L-2 6 L8 -7" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
      </g>
    </svg>
  )
}
