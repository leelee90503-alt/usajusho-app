import { redirect, Link } from "@/i18n/navigation"
import { getLocale, getTranslations } from "next-intl/server"
import { createClient } from "@/lib/supabase/server"
import RequestForm from "./request-form"
import RequestList from "./request-list"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export default async function PurchaseRequestsPage() {
  const locale = await getLocale()
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect({ href: "/login", locale })
    return
  }

  const t = await getTranslations("purchaseRequests")

  const { data: requests } = await supabase
    .from("purchase_requests")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })

  return (
    <main className="min-h-screen bg-[var(--usj-surface)]">
      <div className="mx-auto max-w-3xl px-6 py-10">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-bold text-primary">
            {t("title")}
          </h1>
          <Link
            href="/dashboard"
            className="text-sm font-medium text-primary hover:underline"
          >
            {t("backToDashboard")}
          </Link>
        </div>
        <p className="mt-1 text-sm text-muted-foreground">{t("description")}</p>

        <Card className="mt-8">
          <CardHeader>
            <CardTitle>{t("newRequestTitle")}</CardTitle>
          </CardHeader>
          <CardContent>
            <RequestForm />
          </CardContent>
        </Card>

        <div className="mt-10">
          <h2 className="text-lg font-semibold text-slate-900">
            {t("myRequests")}
          </h2>
          <RequestList requests={requests ?? []} />
        </div>
      </div>
    </main>
  )
}
