"use client"

export default function PrintButton({ label }: { label: string }) {
  return (
    <button
      onClick={() => window.print()}
      className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-semibold text-slate-700"
    >
      {label}
    </button>
  )
}
