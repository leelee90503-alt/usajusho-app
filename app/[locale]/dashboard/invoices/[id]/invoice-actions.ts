"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"

type InvoiceHeaderInput = Partial<{
  invoice_issue_date: string
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
}>

type InvoiceItemInput = {
  product_name: string
  quantity: number
  unit_price: number
  country_of_origin?: string
  hs_code?: string
}

const MUTABLE_STATUSES = ["draft", "correction_required"]

// Only these columns may ever be written by updateInvoiceHeader. Never spread
// a client-supplied object directly into a Supabase .update() call -- this
// allowlist is what stops a crafted request from setting status, admin_*
// fields, or submitted_at directly.
const HEADER_ALLOWED_KEYS = [
  "invoice_issue_date",
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

export async function createOrGetDraftInvoice(packageId: string) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { error: "ログインしてください。" }
  }

  // Ownership check on the package itself -- RLS on `packages` also enforces
  // this, but we check explicitly so we can return a clear error instead of
  // an empty/ambiguous result.
  const { data: pkg, error: pkgError } = await supabase
    .from("packages")
    .select("id, user_id, tracking_number")
    .eq("id", packageId)
    .eq("user_id", user.id)
    .single()

  if (pkgError || !pkg) {
    return { error: "パッケージが見つかりません。" }
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
      user_id: user.id,
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

  // No revalidatePath here: this function is called directly from the page's
  // Server Component render path (see page.tsx), and calling revalidatePath
  // during a render is unsupported by Next.js ("used revalidatePath during
  // render"). The page is already rendering fresh, so there's nothing stale
  // to invalidate for this particular call.

  return { success: true, invoice: created }
}

export async function updateInvoiceHeader(
  invoiceId: string,
  fields: InvoiceHeaderInput
) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { error: "ログインしてください。" }
  }

  const { data: invoice, error: fetchError } = await supabase
    .from("invoices")
    .select("id, user_id, status, package_id")
    .eq("id", invoiceId)
    .single()

  if (fetchError || !invoice) {
    return { error: "インボイスが見つかりません。" }
  }

  if (invoice.user_id !== user.id) {
    return { error: "権限がありません。" }
  }

  if (!MUTABLE_STATUSES.includes(invoice.status)) {
    return { error: "このインボイスは編集できません。" }
  }

  const safeFields = pickAllowed(fields, HEADER_ALLOWED_KEYS)

  const { error: updateError } = await supabase
    .from("invoices")
    .update({ ...safeFields, updated_at: new Date().toISOString() })
    .eq("id", invoiceId)

  if (updateError) {
    return { error: updateError.message }
  }

  revalidatePath(`/dashboard/invoices/${invoice.package_id}`)

  return { success: true }
}

async function getMutableInvoiceForItemAction(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string,
  invoiceId: string
) {
  const { data: invoice, error } = await supabase
    .from("invoices")
    .select("id, user_id, status, package_id")
    .eq("id", invoiceId)
    .single()

  if (error || !invoice) {
    return { error: "インボイスが見つかりません。" } as const
  }
  if (invoice.user_id !== userId) {
    return { error: "権限がありません。" } as const
  }
  if (!MUTABLE_STATUSES.includes(invoice.status)) {
    return { error: "このインボイスは編集できません。" } as const
  }
  return { invoice } as const
}

export async function addInvoiceItem(invoiceId: string, item: InvoiceItemInput) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { error: "ログインしてください。" }

  const guard = await getMutableInvoiceForItemAction(supabase, user.id, invoiceId)
  if ("error" in guard) return guard

  if (!item.product_name?.trim()) {
    return { error: "商品名を入力してください。" }
  }
  const quantity = Number(item.quantity)
  const unitPrice = Number(item.unit_price)
  if (!Number.isFinite(quantity) || quantity <= 0) {
    return { error: "数量を正しく入力してください。" }
  }
  if (!Number.isFinite(unitPrice) || unitPrice < 0) {
    return { error: "単価を正しく入力してください。" }
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

  revalidatePath(`/dashboard/invoices/${guard.invoice.package_id}`)
  return { success: true }
}

export async function duplicateInvoiceItem(itemId: string) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { error: "ログインしてください。" }

  const { data: item, error: itemError } = await supabase
    .from("invoice_items")
    .select("*")
    .eq("id", itemId)
    .single()

  if (itemError || !item) {
    return { error: "品目が見つかりません。" }
  }

  const guard = await getMutableInvoiceForItemAction(supabase, user.id, item.invoice_id)
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

  revalidatePath(`/dashboard/invoices/${guard.invoice.package_id}`)
  return { success: true }
}

export async function updateInvoiceItem(
  itemId: string,
  fields: Partial<InvoiceItemInput>
) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { error: "ログインしてください。" }

  const { data: item, error: itemError } = await supabase
    .from("invoice_items")
    .select("*")
    .eq("id", itemId)
    .single()

  if (itemError || !item) {
    return { error: "品目が見つかりません。" }
  }

  const guard = await getMutableInvoiceForItemAction(supabase, user.id, item.invoice_id)
  if ("error" in guard) return guard

  const quantity = fields.quantity !== undefined ? Number(fields.quantity) : item.quantity
  const unitPrice = fields.unit_price !== undefined ? Number(fields.unit_price) : item.unit_price

  if (!Number.isFinite(quantity) || quantity <= 0) {
    return { error: "数量を正しく入力してください。" }
  }
  if (!Number.isFinite(unitPrice) || unitPrice < 0) {
    return { error: "単価を正しく入力してください。" }
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

  revalidatePath(`/dashboard/invoices/${guard.invoice.package_id}`)
  return { success: true }
}

export async function deleteInvoiceItem(itemId: string) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { error: "ログインしてください。" }

  const { data: item, error: itemError } = await supabase
    .from("invoice_items")
    .select("*")
    .eq("id", itemId)
    .single()

  if (itemError || !item) {
    return { error: "品目が見つかりません。" }
  }

  const guard2 = await getMutableInvoiceForItemAction(supabase, user.id, item.invoice_id)
  if ("error" in guard2) return guard2

  const { error: deleteError } = await supabase
    .from("invoice_items")
    .delete()
    .eq("id", itemId)

  if (deleteError) {
    return { error: deleteError.message }
  }

  revalidatePath(`/dashboard/invoices/${guard2.invoice.package_id}`)
  return { success: true }
}

export async function submitInvoice(
  invoiceId: string,
  signOff: { certificationAccepted: boolean; customerSignature: string }
) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { error: "ログインしてください。" }

  if (!signOff.certificationAccepted) {
    return { error: "認証事項に同意してください。" }
  }
  if (!signOff.customerSignature?.trim()) {
    return { error: "署名を入力してください。" }
  }

  const { data: invoice, error: fetchError } = await supabase
    .from("invoices")
    .select("*, invoice_items(*)")
    .eq("id", invoiceId)
    .single()

  if (fetchError || !invoice) {
    return { error: "インボイスが見つかりません。" }
  }
  if (invoice.user_id !== user.id) {
    return { error: "権限がありません。" }
  }
  if (!MUTABLE_STATUSES.includes(invoice.status)) {
    return { error: "このインボイスは提出できません。" }
  }

  const missing: string[] = []
  if (!invoice.shipper_name) missing.push("shipper_name")
  if (!invoice.shipper_address) missing.push("shipper_address")
  if (!invoice.consignee_name) missing.push("consignee_name")
  if (!invoice.consignee_address) missing.push("consignee_address")
  if (!invoice.reason_for_export) missing.push("reason_for_export")
  if (!invoice.currency) missing.push("currency")
  if (!invoice.shipping_terms) missing.push("shipping_terms")
  if (!invoice.invoice_items || invoice.invoice_items.length === 0) missing.push("invoice_items")

  if (missing.length > 0) {
    return { error: "必須項目が入力されていません。", missingFields: missing }
  }

  const { error: updateError } = await supabase
    .from("invoices")
    .update({
      status: "customer_submitted",
      certification_accepted: true,
      customer_signature: signOff.customerSignature.trim(),
      submitted_at: new Date().toISOString(),
      customer_signed_at: new Date().toISOString(),
      signature_date: new Date().toISOString().slice(0, 10),
      updated_at: new Date().toISOString(),
    })
    .eq("id", invoiceId)

  if (updateError) {
    return { error: updateError.message }
  }

  revalidatePath("/dashboard")
  revalidatePath(`/dashboard/invoices/${invoice.package_id}`)

  return { success: true }
}
