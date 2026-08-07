import { redirect, Link } from "@/i18n/navigation"
import { getLocale, getTranslations } from "next-intl/server"
import { createClient } from "@/lib/supabase/server"
import RateRow from "./rate-row"
import AddRateForm from "./add-rate-form"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

export default async function AdminPricingPage() {
  const locale = await getLocale()
  const supabase = await createClient()

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

  const t = await getTranslations("adminPricing")

  const { data: rates } = await supabase
    .from("shipping_rates")
    .select("*")
    .order("min_weight_kg", { ascending: true })

  const rateList = rates ?? []

  return (
    <main className="min-h-screen bg-[var(--usj-surface)]">
      <div className="mx-auto max-w-3xl px-6 py-10">
        <div className="flex items-center justify-between gap-4">
          <h1 className="text-xl font-bold text-primary">{t("title")}</h1>
          <Button asChild variant="ghost" size="sm">
            <Link href="/admin/packages">{t("backToPackages")}</Link>
          </Button>
        </div>
        <p className="mt-1 text-sm text-muted-foreground">{t("description")}</p>

        <Card className="mt-6">
          <CardHeader>
            <CardTitle>{t("addHeading")}</CardTitle>
          </CardHeader>
          <CardContent>
            <AddRateForm />
          </CardContent>
        </Card>

        <div className="mt-8">
          <h2 className="text-lg font-semibold text-foreground">
            {t("listHeading", { count: rateList.length })}
          </h2>

          <div className="mt-3 space-y-3">
            {rateList.map((rate) => (
              <RateRow key={rate.id} rate={rate} />
            ))}

            {rateList.length === 0 && (
              <Card className="border-dashed">
                <CardContent className="py-8 text-center text-sm text-muted-foreground">
                  {t("empty")}
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </main>
  )
}
