import { getTranslations, getLocale } from 'next-intl/server'
import { redirect, Link } from '@/i18n/navigation'
import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import PrintButton from './print-button'
import InvoiceForm from './invoice-form'
import { createOrGetDraftInvoice } from './invoice-actions'
import { Card, CardAction, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ArrowLeft } from 'lucide-react'

export default async function InvoiceDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const locale = await getLocale()
  const supabase = await createClient()
  const { id } = await params

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect({ href: "/login", locale })
    return
  }

  const t = await getTranslations("invoiceDetail")

  const { data: pkg } = await supabase
    .from("packages")
    .select("*, profiles(full_name, suite_number)")
    .eq("id", id)
    .eq("user_id", user.id)
    .single()

  if (!pkg) {
    notFound()
  }

  const it = await getTranslations("invoiceForm")
  const invoiceFormLabels = {
    title: it("title"),
    statusDraft: it("statusDraft"),
    statusSubmitted: it("statusSubmitted"),
    statusCorrectionRequired: it("statusCorrectionRequired"),
    statusAdminReview: it("statusAdminReview"),
    statusComplete: it("statusComplete"),
    correctionBannerTitle: it("correctionBannerTitle"),
    noticeWhyNeeded: it("noticeWhyNeeded"),
    noticeEnglishRequired: it("noticeEnglishRequired"),
    noticeAccurateValue: it("noticeAccurateValue"),
    noticeCustomsDuties: it("noticeCustomsDuties"),
    noticeProhibitedItems: it("noticeProhibitedItems"),
    noticeCorrections: it("noticeCorrections"),
    shipperName: it("shipperName"),
    shipperAddress: it("shipperAddress"),
    consigneeName: it("consigneeName"),
    consigneeAddress: it("consigneeAddress"),
    reasonForExport: it("reasonForExport"),
    shippingTerms: it("shippingTerms"),
    lineItemsTitle: it("lineItemsTitle"),
    productName: it("productName"),
    quantity: it("quantity"),
    unitPrice: it("unitPrice"),
    itemTotal: it("itemTotal"),
    countryOfOrigin: it("countryOfOrigin"),
    hsCode: it("hsCode"),
    currencySymbol: it("currencySymbol"),
    duplicate: it("duplicate"),
    delete: it("delete"),
    noItems: it("noItems"),
    addItem: it("addItem"),
    totalDeclaredValue: it("totalDeclaredValue"),
    submit: it("submit"),
    submitConfirmTitle: it("submitConfirmTitle"),
    submitConfirmBody: it("submitConfirmBody"),
    certificationStatement: it("certificationStatement"),
    customerSignature: it("customerSignature"),
    cancel: it("cancel"),
    confirmSubmit: it("confirmSubmit"),
  }

  const invoiceResult = await createOrGetDraftInvoice(pkg.id)

  return (
    <main className="min-h-screen bg-slate-50 print:bg-white">
      <div className="mx-auto max-w-2xl px-6 py-10">
        <div className="flex items-center justify-between print:hidden">
          <Link
            href="/dashboard/invoices"
            className="flex items-center gap-1.5 text-sm font-medium text-primary hover:underline"
          >
            <ArrowLeft className="h-4 w-4" />
            {t("backToInvoices")}
          </Link>
          <PrintButton label={t("print")} />
        </div>

        <Card className="mt-6">
          <CardHeader className="border-b">
            <CardTitle className="text-xl font-bold text-slate-900">{t("title")}</CardTitle>
            <p className="text-xs text-muted-foreground">
              {t("suiteLabel")}
              {pkg.profiles?.suite_number}
            </p>
            <CardAction>
              <p className="text-sm font-semibold text-primary">USAJUSHO</p>
            </CardAction>
          </CardHeader>

          <CardContent>
            <table className="w-full text-sm">
              <tbody>
                <tr>
                  <td className="py-1.5 text-muted-foreground">{t("itemNameLabel")}</td>
                  <td className="py-1.5 text-right font-medium text-slate-900">{pkg.item_name}</td>
                </tr>
                {pkg.tracking_number && (
                  <tr>
                    <td className="py-1.5 text-muted-foreground">{t("trackingNumberLabel")}</td>
                    <td className="py-1.5 text-right font-medium text-slate-900">
                      {pkg.tracking_number}
                    </td>
                  </tr>
                )}
                {pkg.weight_kg != null && (
                  <tr>
                    <td className="py-1.5 text-muted-foreground">{t("weightLabel")}</td>
                    <td className="py-1.5 text-right font-medium text-slate-900">
                      {pkg.weight_kg} {t("weightUnit")}
                    </td>
                  </tr>
                )}
                {pkg.length_cm && pkg.width_cm && pkg.height_cm && (
                  <tr>
                    <td className="py-1.5 text-muted-foreground">{t("dimensionsLabel")}</td>
                    <td className="py-1.5 text-right font-medium text-slate-900">
                      {pkg.length_cm} x {pkg.width_cm} x {pkg.height_cm} {t("dimensionsUnit")}
                    </td>
                  </tr>
                )}
                {pkg.chargeable_weight_kg != null && (
                  <tr>
                    <td className="py-1.5 text-muted-foreground">{t("chargeableWeightLabel")}</td>
                    <td className="py-1.5 text-right font-medium text-slate-900">
                      {pkg.chargeable_weight_kg} {t("weightUnit")}
                    </td>
                  </tr>
                )}
                <tr>
                  <td className="py-1.5 text-muted-foreground">{t("paidOnLabel")}</td>
                  <td className="py-1.5 text-right font-medium text-slate-900">
                    {new Date(pkg.updated_at).toLocaleDateString()}
                  </td>
                </tr>
              </tbody>
            </table>

            <div className="mt-6 flex items-center justify-between border-t border-slate-200 pt-6">
              <p className="text-sm font-semibold text-slate-900">{t("totalLabel")}</p>
              <p className="text-lg font-bold text-primary">
                {pkg.quote_amount != null ? Number(pkg.quote_amount).toLocaleString() : "-"}{" "}
                {t("currency")}
              </p>
            </div>

            {pkg.quote_note && (
              <p className="mt-4 text-xs text-muted-foreground">{pkg.quote_note}</p>
            )}
          </CardContent>
        </Card>

        {invoiceResult.invoice && (
          <InvoiceForm invoice={invoiceResult.invoice} labels={invoiceFormLabels} />
        )}
      </div>
    </main>
  )
}
