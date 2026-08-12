
"use server"

import { createClient } from "@/lib/supabase/server"
import { getLocale } from "next-intl/server"
import { redirect } from "@/i18n/navigation"
import { revalidatePath } from "next/cache"
import { notifyUser } from "@/lib/notifications"
import { shippingEmailSteps, purchaseEmailSteps, type EmailStep } from "@/lib/email-template"

// Builds the email progress-stepper for an invoice-related notification,
// given the linked package's status/source (fetched alongside the invoice
// row via the "packages(...)" embedded select below). Returns undefined
// when the package couldn't be resolved, so the email simply omits the
// stepper rather than showing a misleading default.
function invoiceEmailSteps(
  pkg:
    | { status: string; source_purchase_request_id: string | null }
    | { status: string; source_purchase_request_id: string | null }[]
    | null
    | undefined,
  invoiceStatus: string
): EmailStep[] | undefined {
  const resolved = Array.isArray(pkg) ? pkg[0] : pkg
  if (!resolved) return undefined
  return resolved.source_purchase_request_id
    ? purchaseEmailSteps({ linkedPackageStatus: resolved.status, hasInvoice: true, invoiceStatus })
    : shippingEmailSteps({ hasPackage: true, packageStatus: resolved.status, hasInvoice: true, invoiceStatus })
}

// Mirrors the requireAdmin() helper already used by app/[locale]/admin/packages/actions.ts:
// redirects non-admins away and returns an authenticated, admin-verified Supabase client.
async function requireAdmin(): Promise<Awaited<ReturnType<typeof createClient>>> {
  const locale = await getLocale()
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect({ href: "/login", locale })
    return undefined as never
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("is_admin")
    .eq("id", user.id)
    .single()

  if (!profile?.is_admin) {
    redirect({ href: "/dashboard", locale })
    return undefined as never
  }

  return supabase
}

type AdminHeaderInput = Partial<{
  invoice_number: string
  invoice_issue_date: string
  package_reference_number: string
  shipment_reference_number: string
  shipper_name: string
  shipper_address: string
  consignee_name: string
  consignee_address: string
  reason_for_export: string
  currency: string
  shipping_terms: string
  package_weight_kg: number
  shipping_cost: number
  insurance_premium: number
  other_costs: number
  certification_accepted: boolean
}>

// Admins may edit any of these header columns at any invoice status -- unlike
// the customer-side action, there is deliberately NO status gate here. Fields
// that represent workflow state or signatures (status, correction_note,
// customer_signature, customer_signed_at, admin_signature, admin_signed_at,
// submitted_at, total_declared_value) are intentionally excluded from this
// allowlist -- they are only ever written by the dedicated transition actions
// below, so a stray client payload can never sneak a state change through
// the generic "edit header" path.
const ADMIN_HEADER_ALLOWED_KEYS = [
  "invoice_number",
  "invoice_issue_date",
  "package_reference_number",
  "shipment_reference_number",
  "shipper_name",
  "shipper_address",
  "consignee_name",
  "consignee_address",
  "reason_for_export",
  "currency",
  "shipping_terms",
  "package_weight_kg",
  "shipping_cost",
  "insurance_premium",
  "other_costs",
  "certification_accepted",
] as const

function pickAllowed<T extends Record<string, unknown>>(
  input: T,
  allowed: readonly string[]
) {
  const out: Record<string, unknown> = {}
  for (const key of allowed) {
    if (key in input) out[key] = input[key]
  }
  return out
}

type AdminItemInput = {
  product_name: string
  quantity: number
  unit_price: number
  country_of_origin?: string
  hs_code?: string
}

// Admin-gated "get or create" -- idempotent so re-clicking "Create Invoice"
// from the list never errors on a row that already exists.

// Fixed company Shipper/Exporter info for Commercial Invoices created in
// admin -- USAJUSHO ships from this address, so it defaults every new
// invoice's Shipper fields (still admin-editable afterward).
const COMPANY_SHIPPER_NAME = "Victoria Tech Innovation"
const COMPANY_SHIPPER_ADDRESS =
  "18533 S. Western Ave., Gardena, CA 90248, USA / Tel: 310.325.5000 / Email: info@usajusho.com"

// Mirrors formatJapanAddress() in app/[locale]/admin/packages/package-row.tsx
// -- formats a customer's Japan address into the single-line free-text
// format the invoices.consignee_address column expects.
function formatJapanAddress(profile:
  | {
      japan_postal_code: string | null
      japan_prefecture: string | null
      japan_city: string | null
      japan_address_line1: string | null
      japan_address_line2: string | null
    }
  | null
  | undefined
): string | null {
  if (!profile) return null
  const parts = [
    profile.japan_postal_code ? `〒${profile.japan_postal_code}` : null,
    profile.japan_prefecture,
    profile.japan_city,
    profile.japan_address_line1,
    profile.japan_address_line2,
  ].filter(Boolean)
  if (parts.length === 0) return null
  return [...parts, "JAPAN"].join(" ")
}
export async function adminCreateOrGetInvoice(packageId: string) {
  const supabase = await requireAdmin()

  const { data: pkg, error: pkgError } = await supabase
    .from("packages")
    .select("id, user_id, tracking_number, profiles(full_name, japan_postal_code, japan_prefecture, japan_city, japan_address_line1, japan_address_line2)")
    .eq("id", packageId)
    .single()

  if (pkgError || !pkg) {
    return { error: "Package not found." }
  }

  const { data: existing, error: existingError } = await supabase
    .from("invoices")
    .select("*, invoice_items(*)")
    .eq("package_id", packageId)
    .maybeSingle()

  if (existingError) {
    return { error: existingError.message }
  }

  if (existing) {
    return { success: true, invoice: existing }
  }

  const invoiceNumber = `INV-${(pkg.tracking_number || pkg.id).toString().slice(-8).toUpperCase()}`
  const profile = Array.isArray(pkg.profiles) ? pkg.profiles[0] : pkg.profiles

  const { data: created, error: createError } = await supabase
    .from("invoices")
    .insert({
      package_id: packageId,
      user_id: pkg.user_id,
      status: "draft",
      invoice_number: invoiceNumber,
      invoice_issue_date: new Date().toISOString().slice(0, 10),
      package_reference_number: pkg.tracking_number ?? null,
      shipper_name: COMPANY_SHIPPER_NAME,
      shipper_address: COMPANY_SHIPPER_ADDRESS,
      consignee_name: profile?.full_name ?? null,
      consignee_address: formatJapanAddress(profile),
    })
    .select("*, invoice_items(*)")
    .single()

  if (createError) {
    return { error: createError.message }
  }

  // No revalidatePath here: called directly from a page's server render path
  // in some call sites (e.g. the "no invoice yet" detail view auto-creating
  // on load would hit the same "revalidatePath during render" bug fixed
  // earlier in the customer flow). Callers that invoke this from a client
  // click (not render) can revalidate themselves afterward if needed.

  return { success: true, invoice: created }
}

export async function adminUpdateInvoiceHeader(
  invoiceId: string,
  fields: AdminHeaderInput
) {
  const supabase = await requireAdmin()

  const { data: invoice, error: fetchError } = await supabase
    .from("invoices")
    .select("id, package_id")
    .eq("id", invoiceId)
    .single()

  if (fetchError || !invoice) {
    return { error: "Invoice not found." }
  }

  const safeFields = pickAllowed(fields, ADMIN_HEADER_ALLOWED_KEYS)

  const { error: updateError } = await supabase
    .from("invoices")
    .update({ ...safeFields, updated_at: new Date().toISOString() })
    .eq("id", invoiceId)

  if (updateError) {
    return { error: updateError.message }
  }

  revalidatePath(`/admin/invoices/${invoice.package_id}`)
  return { success: true }
}

async function getInvoiceForItemAction(
  supabase: Awaited<ReturnType<typeof createClient>>,
  invoiceId: string
) {
  const { data: invoice, error } = await supabase
    .from("invoices")
    .select("id, package_id")
    .eq("id", invoiceId)
    .single()

  if (error || !invoice) {
    return { error: "Invoice not found." } as const
  }
  return { invoice } as const
}

export async function adminAddInvoiceItem(invoiceId: string, item: AdminItemInput) {
  const supabase = await requireAdmin()

  const guard = await getInvoiceForItemAction(supabase, invoiceId)
  if ("error" in guard) return guard

  if (!item.product_name?.trim()) {
    return { error: "Product name is required." }
  }
  const quantity = Number(item.quantity)
  const unitPrice = Number(item.unit_price)
  if (!Number.isFinite(quantity) || quantity <= 0) {
    return { error: "Enter a valid quantity." }
  }
  if (!Number.isFinite(unitPrice) || unitPrice < 0) {
    return { error: "Enter a valid unit price." }
  }

  const { data: maxRow } = await supabase
    .from("invoice_items")
    .select("sort_order")
    .eq("invoice_id", invoiceId)
    .order("sort_order", { ascending: false })
    .limit(1)
    .maybeSingle()

  const nextSortOrder = (maxRow?.sort_order ?? -1) + 1

  const { error: insertError } = await supabase.from("invoice_items").insert({
    invoice_id: invoiceId,
    product_name: item.product_name.trim(),
    quantity,
    unit_price: unitPrice,
    item_total_amount: Math.round(quantity * unitPrice * 100) / 100,
    country_of_origin: item.country_of_origin || null,
    hs_code: item.hs_code || null,
    sort_order: nextSortOrder,
  })

  if (insertError) {
    return { error: insertError.message }
  }

  revalidatePath(`/admin/invoices/${guard.invoice.package_id}`)
  return { success: true }
}

// Best-effort machine translation via the free, keyless MyMemory API. Used
// only by adminImportItemsFromPackage below -- if this fails or times out for
// any reason, we fall back to the original (Japanese) text rather than
// blocking the import, since an editable placeholder is more useful to the
// admin than a failed action.
async function translateToEnglish(text: string): Promise<string> {
  const trimmed = text.trim()
  if (!trimmed) return trimmed
  try {
    const url = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(trimmed)}&langpair=ja|en`
    const res = await fetch(url, { signal: AbortSignal.timeout(8000) })
    if (!res.ok) return trimmed
    const data = await res.json()
    const translated = data?.responseData?.translatedText
    return typeof translated === "string" && translated.trim() ? translated.trim() : trimmed
  } catch {
    return trimmed
  }
}

// Pulls the customer's declared item(s) for this invoice's package into
// invoice_items, translating each product name to English along the way.
// Prefers package_declarations rows the customer matched to this package
// (item_name + their own declared purchase price, order_amount) since that
// is the customs-declarable value; falls back to the package's own
// item_name (admin-entered) with no price if no declarations are matched.
// Imported rows are plain invoice_items rows -- fully editable/deletable
// afterward just like manually-added ones.
export async function adminImportItemsFromPackage(invoiceId: string, packageId: string) {
  const supabase = await requireAdmin()

  const guard = await getInvoiceForItemAction(supabase, invoiceId)
  if ("error" in guard) return guard

  const { data: pkg, error: pkgError } = await supabase
    .from("packages")
    .select("item_name")
    .eq("id", packageId)
    .single()

  if (pkgError || !pkg) {
    return { error: "Package not found." }
  }

  const { data: declarations, error: declError } = await supabase
    .from("package_declarations")
    .select("item_name, order_amount")
    .eq("matched_package_id", packageId)

  if (declError) {
    return { error: declError.message }
  }

  const sources =
    declarations && declarations.length > 0
      ? declarations.map((d) => ({ name: d.item_name, amount: d.order_amount }))
      : [{ name: pkg.item_name, amount: null as number | null }]

  const { data: maxRow } = await supabase
    .from("invoice_items")
    .select("sort_order")
    .eq("invoice_id", invoiceId)
    .order("sort_order", { ascending: false })
    .limit(1)
    .maybeSingle()

  let nextSortOrder = (maxRow?.sort_order ?? -1) + 1
  let importedCount = 0

  for (const source of sources) {
    if (!source.name?.trim()) continue
    const translatedName = await translateToEnglish(source.name)
    const unitPrice = source.amount != null ? Number(source.amount) : 0

    const { error: insertError } = await supabase.from("invoice_items").insert({
      invoice_id: invoiceId,
      product_name: translatedName,
      quantity: 1,
      unit_price: unitPrice,
      item_total_amount: Math.round(unitPrice * 100) / 100,
      country_of_origin: null,
      hs_code: null,
      sort_order: nextSortOrder,
    })

    if (insertError) {
      return { error: insertError.message }
    }

    nextSortOrder += 1
    importedCount += 1
  }

  if (importedCount === 0) {
    return { error: "No items found on this package to import." }
  }

  revalidatePath(`/admin/invoices/${guard.invoice.package_id}`)
  return { success: true, importedCount }
}

export async function adminDuplicateInvoiceItem(itemId: string) {
  const supabase = await requireAdmin()

  const { data: item, error: itemError } = await supabase
    .from("invoice_items")
    .select("*")
    .eq("id", itemId)
    .single()

  if (itemError || !item) {
    return { error: "Item not found." }
  }

  const guard = await getInvoiceForItemAction(supabase, item.invoice_id)
  if ("error" in guard) return guard

  const { error: insertError } = await supabase.from("invoice_items").insert({
    invoice_id: item.invoice_id,
    product_name: item.product_name,
    quantity: item.quantity,
    unit_price: item.unit_price,
    item_total_amount: item.item_total_amount,
    country_of_origin: item.country_of_origin,
    hs_code: item.hs_code,
    sort_order: item.sort_order + 1,
  })

  if (insertError) {
    return { error: insertError.message }
  }

  revalidatePath(`/admin/invoices/${guard.invoice.package_id}`)
  return { success: true }
}

export async function adminUpdateInvoiceItem(
  itemId: string,
  fields: Partial<AdminItemInput>
) {
  const supabase = await requireAdmin()

  const { data: item, error: itemError } = await supabase
    .from("invoice_items")
    .select("*")
    .eq("id", itemId)
    .single()

  if (itemError || !item) {
    return { error: "Item not found." }
  }

  const guard = await getInvoiceForItemAction(supabase, item.invoice_id)
  if ("error" in guard) return guard

  const quantity = fields.quantity !== undefined ? Number(fields.quantity) : item.quantity
  const unitPrice = fields.unit_price !== undefined ? Number(fields.unit_price) : item.unit_price

  if (!Number.isFinite(quantity) || quantity <= 0) {
    return { error: "Enter a valid quantity." }
  }
  if (!Number.isFinite(unitPrice) || unitPrice < 0) {
    return { error: "Enter a valid unit price." }
  }

  const { error: updateError } = await supabase
    .from("invoice_items")
    .update({
      product_name: fields.product_name?.trim() ?? item.product_name,
      quantity,
      unit_price: unitPrice,
      item_total_amount: Math.round(quantity * unitPrice * 100) / 100,
      country_of_origin: fields.country_of_origin ?? item.country_of_origin,
      hs_code: fields.hs_code ?? item.hs_code,
      updated_at: new Date().toISOString(),
    })
    .eq("id", itemId)

  if (updateError) {
    return { error: updateError.message }
  }

  revalidatePath(`/admin/invoices/${guard.invoice.package_id}`)
  return { success: true }
}

export async function adminDeleteInvoiceItem(itemId: string) {
  const supabase = await requireAdmin()

  const { data: item, error: itemError } = await supabase
    .from("invoice_items")
    .select("*")
    .eq("id", itemId)
    .single()

  if (itemError || !item) {
    return { error: "Item not found." }
  }

  const guard = await getInvoiceForItemAction(supabase, item.invoice_id)
  if ("error" in guard) return guard

  const { error: deleteError } = await supabase
    .from("invoice_items")
    .delete()
    .eq("id", itemId)

  if (deleteError) {
    return { error: deleteError.message }
  }

  revalidatePath(`/admin/invoices/${guard.invoice.package_id}`)
  return { success: true }
}

// Submits the invoice on the customer's behalf. Per product decision, this
// pushes straight to `customer_submitted` without requiring the customer's
// own confirmation, and deliberately leaves customer_signature /
// customer_signed_at NULL rather than fabricating a customer action that
// didn't happen -- the absence of those two fields on a customer_submitted
// invoice is itself the (UI-invisible, DB-visible) audit trail that an admin
// pushed it through on the customer's behalf.
export async function adminSubmitOnBehalf(invoiceId: string) {
  const supabase = await requireAdmin()

  const { data: invoice, error: fetchError } = await supabase
    .from("invoices")
    .select("*, invoice_items(*), packages(status, source_purchase_request_id)")
    .eq("id", invoiceId)
    .single()

  if (fetchError || !invoice) {
    return { error: "Invoice not found." }
  }

  if (invoice.status !== "draft" && invoice.status !== "correction_required") {
    return { error: "This invoice cannot be submitted from its current status." }
  }

  const { error: updateError } = await supabase
    .from("invoices")
    .update({
      status: "customer_submitted",
      submitted_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq("id", invoiceId)

  if (updateError) {
    return { error: updateError.message }
  }

  await notifyUser(supabase, {
    userId: invoice.user_id,
    packageId: invoice.package_id,
    title: "インボイスが提出されました",
    body: `商業インボイス${invoice.invoice_number ?? ""}をレビューのため提出いたしました。内容を確認のうえ、担当者より改めてご連絡いたします。`,
    titleEn: "Invoice submitted",
    bodyEn: `Your commercial invoice ${invoice.invoice_number ?? ""} has been submitted for review.`,
    emailDetails: {
      invoiceNumber: invoice.invoice_number,
      weightKg: invoice.package_weight_kg,
      statusBadge: "審査中",
    },
    emailSteps: invoiceEmailSteps(invoice.packages, "customer_submitted"),
    emailCtaLabel: "ダッシュボードで確認する",
  })

  revalidatePath(`/admin/invoices/${invoice.package_id}`)
  revalidatePath(`/dashboard/invoices/${invoice.package_id}`)
  return { success: true }
}

export async function adminRequestCorrection(invoiceId: string, correctionNote: string) {
  const supabase = await requireAdmin()

  if (!correctionNote?.trim()) {
    return { error: "A correction note is required." }
  }

  const { data: invoice, error: fetchError } = await supabase
    .from("invoices")
    .select("id, package_id, user_id, status, invoice_number, package_weight_kg, packages(status, source_purchase_request_id)")
    .eq("id", invoiceId)
    .single()

  if (fetchError || !invoice) {
    return { error: "Invoice not found." }
  }

  const { error: updateError } = await supabase
    .from("invoices")
    .update({
      status: "correction_required",
      correction_note: correctionNote.trim(),
      updated_at: new Date().toISOString(),
    })
    .eq("id", invoiceId)

  if (updateError) {
    return { error: updateError.message }
  }

  await notifyUser(supabase, {
    userId: invoice.user_id,
    packageId: invoice.package_id,
    title: "インボイスの修正が必要です",
    body: `商業インボイス${invoice.invoice_number ?? ""}につきまして、恐れ入りますが修正をお願いいたします。修正内容：${correctionNote.trim()}`,
    titleEn: "Invoice correction needed",
    bodyEn: `Your commercial invoice ${invoice.invoice_number ?? ""} needs a correction: ${correctionNote.trim()}`,
    emailDetails: {
      invoiceNumber: invoice.invoice_number,
      weightKg: invoice.package_weight_kg,
      statusBadge: "修正をお願いしております",
    },
    emailSteps: invoiceEmailSteps(invoice.packages, "correction_required"),
    emailCtaLabel: "ダッシュボードでインボイスを修正する",
  })

  revalidatePath(`/admin/invoices/${invoice.package_id}`)
  revalidatePath(`/dashboard/invoices/${invoice.package_id}`)
  return { success: true }
}

export async function adminApproveAndComplete(invoiceId: string) {
  const supabase = await requireAdmin()

  const {
    data: { user: adminUser },
  } = await supabase.auth.getUser()

  const { data: invoice, error: fetchError } = await supabase
    .from("invoices")
    .select("id, package_id, user_id, invoice_number, package_weight_kg, packages(status, source_purchase_request_id)")
    .eq("id", invoiceId)
    .single()

  if (fetchError || !invoice) {
    return { error: "Invoice not found." }
  }

  const { data: adminProfile } = await supabase
    .from("profiles")
    .select("full_name")
    .eq("id", adminUser?.id ?? "")
    .single()

  const { error: updateError } = await supabase
    .from("invoices")
    .update({
      status: "complete",
      admin_signature: adminProfile?.full_name ?? adminUser?.email ?? "Admin",
      admin_signed_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq("id", invoiceId)

  if (updateError) {
    return { error: updateError.message }
  }

  await notifyUser(supabase, {
    userId: invoice.user_id,
    packageId: invoice.package_id,
    title: "インボイスが承認されました",
    body: `商業インボイス${invoice.invoice_number ?? ""}が承認され、手続きが完了いたしました。発送に向けて準備を進めてまいります。`,
    titleEn: "Invoice approved",
    bodyEn: `Your commercial invoice ${invoice.invoice_number ?? ""} has been approved and is now complete.`,
    emailDetails: {
      invoiceNumber: invoice.invoice_number,
      weightKg: invoice.package_weight_kg,
      statusBadge: "承認済み",
    },
    emailSteps: invoiceEmailSteps(invoice.packages, "complete"),
    emailCtaLabel: "ダッシュボードで確認する",
  })

  revalidatePath(`/admin/invoices/${invoice.package_id}`)
  revalidatePath(`/dashboard/invoices/${invoice.package_id}`)
  return { success: true }
}
