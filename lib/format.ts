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
