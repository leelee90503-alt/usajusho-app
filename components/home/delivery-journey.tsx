type Step = {
  title: string
  description: string
}

/**
 * PRD §4 "일러스트 배송 프로세스": a single connected illustration of the
 * package's journey from US signup through to delivery in Japan — not six
 * identical icons in a card grid. Desktop renders one continuous horizontal
 * route; mobile stacks it vertically. Built as inline SVG glyphs (no stock
 * art) in the USAJUSHO navy / teal palette.
 */
export default function DeliveryJourney({ steps }: { steps: Step[] }) {
  const icons = [SignupIcon, CartIcon, DeclareIcon, WarehouseIcon, InvoiceIcon, PlaneIcon, HomeIcon]

  return (
    <div className="relative">
      {/* Desktop: continuous horizontal route */}
      <div className="hidden md:block relative">
        <svg
          viewBox="0 0 1200 40"
          className="absolute top-6 left-0 w-full h-10 text-[var(--usj-accent)]/40"
          preserveAspectRatio="none"
          aria-hidden="true"
        >
          <path
            d="M 100 20 Q 300 -10 500 20 T 900 20 T 1100 20"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeDasharray="6 6"
          />
        </svg>
        <ol className="relative grid grid-cols-7 gap-4">
          {steps.map((step, i) => {
            const Icon = icons[i]
            return (
              <li key={step.title} className="flex flex-col items-center text-center">
                <div className="w-12 h-12 rounded-full bg-white border-2 border-[var(--usj-primary)] flex items-center justify-center mb-4 relative z-10">
                  <Icon className="w-6 h-6 text-[var(--usj-primary)]" />
                </div>
                <p className="text-xs font-semibold text-[var(--usj-text)] mb-1">
                  {i + 1}. {step.title}
                </p>
                <p className="text-xs text-slate-500 leading-relaxed">{step.description}</p>
              </li>
            )
          })}
        </ol>
      </div>

      {/* Mobile: vertical stacked journey */}
      <ol className="md:hidden relative pl-6">
        <div
          className="absolute left-[23px] top-2 bottom-2 w-px bg-[var(--usj-accent)]/40"
          aria-hidden="true"
        />
        {steps.map((step, i) => {
          const Icon = icons[i]
          return (
            <li key={step.title} className="relative flex gap-4 pb-8 last:pb-0">
              <div className="w-12 h-12 rounded-full bg-white border-2 border-[var(--usj-primary)] flex items-center justify-center shrink-0 relative z-10 -ml-6">
                <Icon className="w-6 h-6 text-[var(--usj-primary)]" />
              </div>
              <div className="pt-2">
                <p className="text-sm font-semibold text-[var(--usj-text)] mb-1">
                  {i + 1}. {step.title}
                </p>
                <p className="text-xs text-slate-500 leading-relaxed">{step.description}</p>
              </div>
            </li>
          )
        })}
      </ol>
    </div>
  )
}

type IconProps = { className?: string }

function SignupIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      <path d="M12 12a4 4 0 100-8 4 4 0 000 8z" stroke="currentColor" strokeWidth="1.6" />
      <path d="M4 20c0-3.3 3.6-6 8-6s8 2.7 8 6" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  )
}

function CartIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      <path
        d="M4 5h2l1.6 9.6a2 2 0 002 1.4h7.3a2 2 0 002-1.6L20 8H6.2"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="10" cy="20" r="1.3" fill="currentColor" />
      <circle cx="17" cy="20" r="1.3" fill="currentColor" />
    </svg>
  )
}

function DeclareIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      <path
        d="M6 3h12v14.5l-1.5-1-1.5 1-1.5-1-1.5 1-1.5-1-1.5 1-1.5-1-1.5 1V3z"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
      <path d="M8.5 7h7M8.5 10h7" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
      <path
        d="M8.5 13.5l1.8 1.8L14 11.5"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function WarehouseIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      <path d="M3 10.5 12 4l9 6.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M5 9.5V20h14V9.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M9.5 20v-5h5v5" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
    </svg>
  )
}

function InvoiceIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      <path d="M6 3h9l3 3v15H6z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
      <path d="M9 9h6M9 12.5h6M9 16h4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  )
}

function PlaneIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      <path
        d="M3 13.5 21 6l-7.5 18-2-7.5L3 13.5z"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinejoin="round"
        strokeLinecap="round"
      />
    </svg>
  )
}

function HomeIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      <path d="M4 11 12 4l8 7" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M6 10v10h12V10" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M10 20v-6h4v6" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
    </svg>
  )
}
