import { redirect, Link } from "@/i18n/navigation"
import { notFound } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { getLocale, getTranslations } from "next-intl/server"
import { adminCreateOrGetInvoice } from "../actions"
import AdminInvoiceForm from "./admin-invoice-form"
import InvoicePrintView from "./invoice-print-view"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

export default async function AdminInvoiceDetailPage({
  params,
}: {
  params: Promise<{ packageId: string }>
}) {
  const locale = await getLocale()
  const supabase = await createClient()
  const { packageId } = await params

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect({ href: "/login", locale })
    return
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("is_admin")
    .eq("id", user.id)
    .single()

  if (!profile?.is_admin) {
    redirect({ href: "/dashboard", locale })
    return
  }

  const { data: pkg } = await supabase
    .from("packages")
    .select("*, profiles(full_name, suite_number)")
    .eq("id", packageId)
    .single()

  if (!pkg) {
    notFound()
  }

  const { data: existingInvoice } = await supabase
    .from("invoices")
    .select("*, invoice_items(*)")
    .eq("package_id", packageId)
    .maybeSingle()

  const t = await getTranslations("adminInvoices")
  const ft = await getTranslations("invoiceForm")

  const formLabels = {
    title: ft("title"),
    printButton: ft("printButton"),
    invoiceDateLabel: ft("invoiceDateLabel"),
    importFromPackageButton: ft("importFromPackageButton"),
    statusDraft: ft("statusDraft"),
    statusSubmitted: ft("statusSubmitted"),
    statusCorrectionRequired: ft("statusCorrectionRequired"),
    statusAdminReview: ft("statusAdminReview"),
    statusComplete: ft("statusComplete"),
    correctionBannerTitle: ft("correctionBannerTitle"),
    shipperName: ft("shipperName"),
    shipperAddress: ft("shipperAddress"),
    consigneeName: ft("consigneeName"),
    consigneeAddress: ft("consigneeAddress"),
    reasonForExport: ft("reasonForExport"),
    shippingTerms: ft("shippingTerms"),
    lineItemsTitle: ft("lineItemsTitle"),
    productName: ft("productName"),
    quantity: ft("quantity"),
    unitPrice: ft("unitPrice"),
    itemTotal: ft("itemTotal"),
    countryOfOrigin: ft("countryOfOrigin"),
    hsCode: ft("hsCode"),
    currencySymbol: ft("currencySymbol"),
    duplicate: ft("duplicate"),
    delete: ft("delete"),
    noItems: ft("noItems"),
    addItem: ft("addItem"),
    totalDeclaredValue: ft("totalDeclaredValue"),
    cancel: ft("cancel"),
    confirm: t("confirm"),
    editCompleteConfirm: t("editCompleteConfirm"),
    editCancelledError: t("editCancelledError"),
    submitOnBehalf: t("submitOnBehalf"),
    submitOnBehalfConfirmTitle: t("submitOnBehalfConfirmTitle"),
    submitOnBehalfConfirmBody: t("submitOnBehalfConfirmBody"),
    requestCorrection: t("requestCorrection"),
    correctionNoteLabel: t("correctionNoteLabel"),
    correctionNotePlaceholder: t("correctionNotePlaceholder"),
    correctionNoteRequired: t("correctionNoteRequired"),
    correctionSentSuccess: t("correctionSentSuccess"),
    sendCorrection: t("sendCorrection"),
    approveComplete: t("approveComplete"),
    approveCompleteConfirmTitle: t("approveCompleteConfirmTitle"),
    approveCompleteConfirmBody: t("approveCompleteConfirmBody"),
  }

  return (
    <main className="mx-auto max-w-4xl px-4 py-10">
      <Link href="/admin/invoices" className="text-xs font-semibold text-accent hover:underline print:hidden">
        {t("backToList")}
      </Link>

      <Card className="mt-4 print:hidden">
        <CardContent className="py-6">
          <h1 className="text-xl font-bold text-foreground">{pkg.item_name}</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {pkg.profiles?.full_name ?? "—"}
            {pkg.profiles?.suite_number ? ` · ${pkg.profiles.suite_number}` : ""}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">{pkg.tracking_number ?? ""}</p>
        </CardContent>
      </Card>

      {existingInvoice ? (
        <>
          <AdminInvoiceForm invoice={existingInvoice} labels={formLabels} />
          <InvoicePrintView invoice={existingInvoice} labels={formLabels} />
        </>
      ) : (
        <Card className="mt-8 border-dashed">
          <CardContent className="py-8 text-center">
            <p className="text-sm text-muted-foreground">{t("noInvoiceYet")}</p>
            <form action={createInvoiceAction.bind(null, packageId)} className="mt-4 inline-block">
              <Button type="submit">{t("createInvoiceButton")}</Button>
            </form>
          </CardContent>
        </Card>
      )}
    </main>
  )
}

async function createInvoiceAction(packageId: string) {
  "use server"
  await adminCreateOrGetInvoice(packageId)
  const { revalidatePath } = await import("next/cache")
  revalidatePath(`/admin/invoices/${packageId}`)
}
