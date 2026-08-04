
"use server"

import { createClient } from "@/lib/supabase/server"
import { getLocale } from "next-intl/server"
import { redirect } from "@/i18n/navigation"
import { revalidatePath } from "next/cache"
import { notifyUser } from "@/lib/notifications"

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
export async function adminCreateOrGetInvoice(packageId: string) {
  const supabase = await requireAdmin()

  const { data: pkg, error: pkgError } = await supabase
    .from("packages")
    .select("id, user_id, tracking_number")
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

  const { data: created, error: createError } = await supabase
    .from("invoices")
    .insert({
      package_id: packageId,
      user_id: pkg.user_id,
      status: "draft",
      invoice_number: invoiceNumber,
      invoice_issue_date: new Date().toISOString().slice(0, 10),
      package_reference_number: pkg.tracking_number ?? null,
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
    .select("*, invoice_items(*)")
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
    title: "Invoice submitted",
    body: `Your commercial invoice ${invoice.invoice_number ?? ""} has been submitted for review.`,
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
    .select("id, package_id, user_id, status, invoice_number")
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
    title: "Invoice correction needed",
    body: `Your commercial invoice ${invoice.invoice_number ?? ""} needs a correction: ${correctionNote.trim()}`,
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
    .select("id, package_id, user_id, invoice_number")
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
    title: "Invoice approved",
    body: `Your commercial invoice ${invoice.invoice_number ?? ""} has been approved and is now complete.`,
  })

  revalidatePath(`/admin/invoices/${invoice.package_id}`)
  revalidatePath(`/dashboard/invoices/${invoice.package_id}`)
  return { success: true }
}
