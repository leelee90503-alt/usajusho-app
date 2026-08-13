import { redirect, Link } from '@/i18n/navigation'
import { createClient } from "@/lib/supabase/server"
import { getLocale, getTranslations } from 'next-intl/server'
import NewDeclarationToggle from "./new-declaration-toggle"
import DeclarationList from "./declaration-list"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"

export default async function DeclarationsPage() {
  const locale = await getLocale()
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect({ href: "/login", locale })
    return
  }

  const { data: declarations } = await supabase
    .from("package_declarations")
    .select("*, declaration_items(product_name, quantity, unit_price, sort_order)")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })

  const withSignedUrls = await Promise.all(
    (declarations ?? []).map(async (d) => {
      if (!d.receipt_path) {
        return { ...d, receipt_url: null }
      }
      const { data: signed } = await supabase.storage
        .from("package-receipts")
        .createSignedUrl(d.receipt_path, 60 * 60)
      return { ...d, receipt_url: signed?.signedUrl ?? null }
    })
  )

  const t = await getTranslations("packageDeclarations")

  return (
    <main className="min-h-screen bg-[var(--usj-surface)]">
      <div className="mx-auto max-w-2xl px-6 py-10">
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-2xl font-bold text-slate-900">{t("pageTitle")}</h1>
          <Button asChild variant="ghost" size="sm">
            <Link href="/dashboard">
              <ArrowLeft className="h-4 w-4" />
              {t("backLink")}
            </Link>
          </Button>
        </div>
        <p className="mb-6 text-sm text-slate-600">{t("pageDescription")}</p>
        <NewDeclarationToggle />
        <DeclarationList declarations={withSignedUrls} />
      </div>
    </main>
  )
}
