import type { Metadata } from "next";
import { Link } from "@/i18n/navigation"
import { getTranslations } from "next-intl/server"
import {
  FileText,
  FileCheck,
  CreditCard,
  ShoppingCart,
  PackageCheck,
  Truck,
  Globe,
  Languages,
  Star,
  Receipt,
  type LucideIcon,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from "@/components/ui/card"


export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "seo.purchaseAgency" });
  return {
    title: t("title"),
    description: t("description"),
  };
}

export default async function PurchaseAgencyPage() {
  const t = await getTranslations("purchaseAgency")

  const steps: { title: string; description: string; icon: LucideIcon }[] = [
    { title: t("step1Title"), description: t("step1Description"), icon: FileText },
    { title: t("step2Title"), description: t("step2Description"), icon: FileCheck },
    { title: t("step3Title"), description: t("step3Description"), icon: CreditCard },
    { title: t("step4Title"), description: t("step4Description"), icon: ShoppingCart },
    { title: t("step5Title"), description: t("step5Description"), icon: PackageCheck },
    { title: t("step6Title"), description: t("step6Description"), icon: Truck },
  ]

  const benefits: { title: string; description: string; icon: LucideIcon }[] = [
    { title: t("benefit1Title"), description: t("benefit1Description"), icon: Globe },
    { title: t("benefit2Title"), description: t("benefit2Description"), icon: Languages },
    { title: t("benefit3Title"), description: t("benefit3Description"), icon: Star },
    { title: t("benefit4Title"), description: t("benefit4Description"), icon: Receipt },
  ]

  return (
    <main className="flex flex-col">
      {/* Hero */}
      <section className="bg-[var(--usj-surface)] border-b border-slate-200">
        <div className="mx-auto max-w-4xl px-4 py-16 md:py-24 text-center">
          <p className="text-[var(--usj-accent)] font-semibold text-sm mb-3 tracking-wide">
            {t("eyebrow")}
          </p>
          <h1 className="text-3xl md:text-5xl font-bold text-primary leading-tight mb-5">
            {t("headline")}
          </h1>
          <p className="text-slate-600 text-base md:text-lg mb-8 max-w-2xl mx-auto leading-relaxed">
            {t("description")}
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            <Button asChild size="lg">
              <Link href="/dashboard/purchase-requests">{t("ctaPrimary")}</Link>
            </Button>
            <Button asChild variant="outline" size="lg" className="text-primary">
              <Link href="/signup">{t("ctaSecondary")}</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Process steps */}
      <section className="mx-auto max-w-5xl px-4 py-16 md:py-20 w-full">
        <div className="text-center mb-10">
          <h2 className="text-2xl md:text-3xl font-bold text-primary">
            {t("stepsTitle")}
          </h2>
          <p className="text-slate-600 mt-2">{t("stepsDescription")}</p>
        </div>
        <ol className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {steps.map((step, index) => {
            const Icon = step.icon
            return (
              <li key={step.title}>
                <Card className="h-full">
                  <CardHeader>
                    <div className="flex items-center gap-3 mb-1">
                      <Badge className="h-7 w-7 shrink-0 justify-center rounded-full p-0 text-sm">
                        {index + 1}
                      </Badge>
                      <Icon className="h-5 w-5 text-primary" aria-hidden="true" />
                    </div>
                    <CardTitle className="text-base">{step.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-slate-600 leading-relaxed">
                      {step.description}
                    </p>
                  </CardContent>
                </Card>
              </li>
            )
          })}
        </ol>
      </section>

      {/* Benefits */}
      <section className="bg-[var(--usj-surface)] border-y border-slate-200">
        <div className="mx-auto max-w-5xl px-4 py-16 md:py-20">
          <div className="text-center mb-10">
            <h2 className="text-2xl md:text-3xl font-bold text-primary">
              {t("benefitsTitle")}
            </h2>
            <p className="text-slate-600 mt-2">{t("benefitsDescription")}</p>
          </div>
          <div className="grid gap-5 sm:grid-cols-2">
            {benefits.map((benefit) => {
              const Icon = benefit.icon
              return (
                <Card key={benefit.title} className="bg-white">
                  <CardHeader>
                    <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                      <Icon className="h-5 w-5 text-primary" aria-hidden="true" />
                    </div>
                    <CardTitle className="text-base">{benefit.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-slate-600 leading-relaxed">
                      {benefit.description}
                    </p>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="mx-auto max-w-3xl px-4 py-16 md:py-20 text-center w-full">
        <h2 className="text-2xl md:text-3xl font-bold text-primary mb-4">
          {t("finalCtaTitle")}
        </h2>
        <p className="text-slate-600 mb-8">{t("finalCtaDescription")}</p>
        <Button asChild size="lg">
          <Link href="/dashboard/purchase-requests">{t("ctaPrimary")}</Link>
        </Button>
      </section>
    </main>
  )
}
