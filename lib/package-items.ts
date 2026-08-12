// Shared helpers for consolidated packages -- a single package (box) that
// holds more than one order, either several items from one shipping-agency
// order or several purchase-agency requests an admin has bundled together
// (합송배송 / 묶음배송). See package-items-migration.sql for the
// package_items table these operate on, and matchAndQuoteDeclaration() /
// markPurchasedAndLinkPackage() for where rows get inserted.

// Builds a short customer-facing summary of everything currently inside a
// package, e.g. "サンプル商品 他2点" for three items, or just the single
// item's name when there's only one. Used to keep packages.item_name (the
// headline shown everywhere in the UI) accurate as more items are folded
// into the same box.
export function summarizeItemNames(names: string[]): string {
  const nonEmpty = names.map((n) => n.trim()).filter(Boolean)
  if (nonEmpty.length === 0) return ""
  if (nonEmpty.length === 1) return nonEmpty[0]
  return `${nonEmpty[0]} 他${nonEmpty.length - 1}点`
}
