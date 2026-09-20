// Shared money-formatting helpers.
//
// USD amounts must always render with exactly two decimal places (e.g.
// "$29.10", not "$29.1"), since Number(x).toLocaleString() silently drops
// trailing zeros. Yen (¥) amounts are whole numbers by convention in this
// app (quote_amount, etc.) and should keep using plain .toLocaleString() --
// do not run yen amounts through this helper.
export function formatUSD(amount: number | string | null | undefined): string {
  const n = Number(amount ?? 0)
  if (!Number.isFinite(n)) return "0.00"
  return n.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })
}

// Approximate USD -> JPY reference rate for marketing-page display only
// (showing Japan-based visitors a rough yen equivalent next to USD prices).
// This is NOT used for billing -- all real charges run through Square in
// USD. Every place this is used must label the figure as approximate
// ("約" / "approx."), since the actual rate moves daily. Update
// periodically to stay in the right ballpark; it does not need to track
// the live rate exactly.
export const APPROX_USD_TO_JPY_RATE = 155

// Formats a USD amount as a rounded, comma-separated yen figure (no symbol --
// callers prepend "¥" or "約¥" themselves). Rounds to the nearest ¥100 since
// this is always a rough reference figure, never an exact charge.
export function formatApproxJPY(usdAmount: number | string | null | undefined): string {
  const n = Number(usdAmount ?? 0)
  if (!Number.isFinite(n)) return "0"
  const jpy = n * APPROX_USD_TO_JPY_RATE
  const rounded = Math.round(jpy / 100) * 100
  return rounded.toLocaleString()
}
