import { getTranslations, getLocale } from 'next-intl/server'
import { redirect } from '@/i18n/navigation'
import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'

export default async function InvoicesPage() {
  const locale = await getLocale()
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect({ href: "/login", locale })
    return
  }

  const t = await getTranslations("invoiceList")

  const { data: packages } = await supabase
    .from("packages")
    .select("*")
    .eq("user_id", user.id)
    .eq("status", "paid")
    .order("updated_at", { ascending: false })

  const invoices = packages ?? []

  return (
    <main className="min-h-screen bg-slate-50">
      <div className="mx-auto max-w-3xl px-6 py-10">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-bold text-slate-900">{t("title")}</h1>
          <Link href="/dashboard" className="text-sm text-teal-700 hover:underline">
            {t("backToDashboard")}
          </Link>
        </div>
        <p className="mt-1 text-sm text-slate-500">{t("description")}</p>

        <div className="mt-6 space-y-3">
          {invoices.map((pkg) => (
            <Link
              key={pkg.id}
              href={`/dashboard/invoices/${pkg.id}`}
              className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm hover:border-teal-300"
            >
              <div>
                <p className="font-semibold text-slate-900">{pkg.item_name}</p>
                <p className="mt-1 text-xs text-slate-500">
                  {t("paidOn")}
                  {new Date(pkg.updated_at).toLocaleDateString()}
                </p>
              </div>
              {pkg.quote_amount != null && (
                <p className="text-sm font-semibold text-teal-700">
                  {Number(pkg.quote_amount).toLocaleString()} {t("currency")}
                </p>
              )}
            </Link>
          ))}

          {invoices.length === 0 && (
            <div className="rounded-xl border border-dashed border-slate-300 bg-white p-8 text-center text-sm text-slate-500">
              {t("empty")}
            </div>
          )}
        </div>
      </div>
    </main>
  )
}
