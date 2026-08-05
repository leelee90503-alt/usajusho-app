import { getTranslations, getLocale } from 'next-intl/server'
import { redirect } from '@/i18n/navigation'
import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { Card, CardContent } from '@/components/ui/card'
import { FileText, ChevronRight } from 'lucide-react'

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
    <main className="min-h-screen bg-[var(--usj-surface)]">
      <div className="mx-auto max-w-3xl px-6 py-10">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-bold text-primary">{t("title")}</h1>
          <Link href="/dashboard" className="text-sm font-medium text-primary hover:underline">
            {t("backToDashboard")}
          </Link>
        </div>
        <p className="mt-1 text-sm text-muted-foreground">{t("description")}</p>

        <div className="mt-6 space-y-3">
          {invoices.map((pkg) => (
            <Link key={pkg.id} href={`/dashboard/invoices/${pkg.id}`}>
              <Card className="transition-shadow hover:shadow-md">
                <CardContent className="flex flex-wrap items-center justify-between gap-3 py-4">
                  <div className="flex items-center gap-3">
                    <FileText className="h-5 w-5 shrink-0 text-muted-foreground" />
                    <div>
                      <p className="font-semibold text-slate-900">{pkg.item_name}</p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {t("paidOn")}
                        {new Date(pkg.updated_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {pkg.quote_amount != null && (
                      <p className="text-sm font-semibold text-primary">
                        {Number(pkg.quote_amount).toLocaleString()} {t("currency")}
                      </p>
                    )}
                    <ChevronRight className="h-4 w-4 text-muted-foreground" />
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}

          {invoices.length === 0 && (
            <Card className="border-dashed">
              <CardContent className="py-8 text-center text-sm text-muted-foreground">
                {t("empty")}
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </main>
  )
}
