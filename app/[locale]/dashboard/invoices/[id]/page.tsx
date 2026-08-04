import { getTranslations, getLocale } from 'next-intl/server'
import { redirect } from '@/i18n/navigation'
import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import PrintButton from './print-button'

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

  return (
    <main className="min-h-screen bg-slate-50 print:bg-white">
      <div className="mx-auto max-w-2xl px-6 py-10">
        <div className="flex items-center justify-between print:hidden">
          <Link href="/dashboard/invoices" className="text-sm text-teal-700 hover:underline">
            {t("backToInvoices")}
          </Link>
          <PrintButton label={t("print")} />
        </div>

        <div className="mt-6 rounded-xl border border-slate-200 bg-white p-8 shadow-sm">
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-xl font-bold text-slate-900">{t("title")}</h1>
              <p className="mt-1 text-xs text-slate-500">
                {t("suiteLabel")}
                {pkg.profiles?.suite_number}
              </p>
            </div>
            <p className="text-sm font-semibold text-teal-700">USAJUSHO</p>
          </div>

          <div className="mt-6 border-t border-slate-200 pt-6">
            <table className="w-full text-sm">
              <tbody>
                <tr>
                  <td className="py-1.5 text-slate-500">{t("itemNameLabel")}</td>
                  <td className="py-1.5 text-right font-medium text-slate-900">{pkg.item_name}</td>
                </tr>
                {pkg.tracking_number && (
                  <tr>
                    <td className="py-1.5 text-slate-500">{t("trackingNumberLabel")}</td>
                    <td className="py-1.5 text-right font-medium text-slate-900">
                      {pkg.tracking_number}
                    </td>
                  </tr>
                )}
                {pkg.weight_kg != null && (
                  <tr>
                    <td className="py-1.5 text-slate-500">{t("weightLabel")}</td>
                    <td className="py-1.5 text-right font-medium text-slate-900">
                      {pkg.weight_kg} {t("weightUnit")}
                    </td>
                  </tr>
                )}
                {pkg.length_cm && pkg.width_cm && pkg.height_cm && (
                  <tr>
                    <td className="py-1.5 text-slate-500">{t("dimensionsLabel")}</td>
                    <td className="py-1.5 text-right font-medium text-slate-900">
                      {pkg.length_cm} x {pkg.width_cm} x {pkg.height_cm} {t("dimensionsUnit")}
                    </td>
                  </tr>
                )}
                {pkg.chargeable_weight_kg != null && (
                  <tr>
                    <td className="py-1.5 text-slate-500">{t("chargeableWeightLabel")}</td>
                    <td className="py-1.5 text-right font-medium text-slate-900">
                      {pkg.chargeable_weight_kg} {t("weightUnit")}
                    </td>
                  </tr>
                )}
                <tr>
                  <td className="py-1.5 text-slate-500">{t("paidOnLabel")}</td>
                  <td className="py-1.5 text-right font-medium text-slate-900">
                    {new Date(pkg.updated_at).toLocaleDateString()}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <div className="mt-6 flex items-center justify-between border-t border-slate-200 pt-6">
            <p className="text-sm font-semibold text-slate-900">{t("totalLabel")}</p>
            <p className="text-lg font-bold text-teal-700">
              {pkg.quote_amount != null ? Number(pkg.quote_amount).toLocaleString() : "-"}{" "}
              {t("currency")}
            </p>
          </div>

          {pkg.quote_note && (
            <p className="mt-4 text-xs text-slate-500">{pkg.quote_note}</p>
          )}
        </div>
      </div>
    </main>
  )
}
