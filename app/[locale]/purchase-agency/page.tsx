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
  MessageCircle,
  Phone,
  Mail,
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
import { createClient } from "@/lib/supabase/server"
import FeeCalculator from "@/components/home/fee-calculator"
import { getPurchaseAgencyPublicFeeSettings } from "@/lib/purchase-agency-settings"
import { formatUSD } from "@/lib/format"
import type { ShippingRate } from "@/lib/pricing"


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
  const th = await getTranslations("home")
  const feeSettings = await getPurchaseAgencyPublicFeeSettings()
  const feePercentDisplay = `${Math.round(feeSettings.feePercent * 100)}%`
  const flatFeeDisplay = `$${formatUSD(feeSettings.flatFeeCents / 100)}`

  const supabase = await createClient()
  const { data: rates } = await supabase
    .from("shipping_rates")
    .select("id, label, min_weight_kg, max_weight_kg, price_per_kg, min_charge, is_active, sort_order")
    .eq("is_active", true)
    .order("sort_order", { ascending: true })

  const shippingRates = (rates ?? []) as ShippingRate[]

  const faqItems = [
    { question: t("faqQ1Question"), answer: t("faqQ1Answer") },
    { question: t("faqQ2Question"), answer: t("faqQ2Answer") },
    { question: t("faqQ3Question"), answer: t("faqQ3Answer") },
    { question: t("faqQ4Question"), answer: t("faqQ4Answer") },
  ]

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
        <div className="mx-auto max-w-6xl px-4 py-16 md:py-24 grid md:grid-cols-2 gap-10 md:gap-12 items-center">
          <div className="text-center md:text-left">
            <p className="text-[var(--usj-accent)] font-semibold text-sm mb-3 tracking-wide">
              {t("eyebrow")}
            </p>
            <h1 className="text-3xl md:text-5xl font-bold text-primary leading-tight mb-5">
              {t("headline")}
            </h1>
            <p className="text-slate-600 text-base md:text-lg mb-8 max-w-2xl mx-auto md:mx-0 leading-relaxed">
              {t("description")}
            </p>
            <div className="flex flex-wrap justify-center md:justify-start gap-3">
              <Button asChild size="lg">
                <Link href="/dashboard/purchase-requests">{t("ctaPrimary")}</Link>
              </Button>
              <Button asChild variant="outline" size="lg" className="text-primary">
                <Link href="/signup">{t("ctaSecondary")}</Link>
              </Button>
            </div>
          </div>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/images/forwarding/checklist-purchase-agency.webp"
            alt={t("heroImageAlt")}
            className="w-full h-auto rounded-lg border border-slate-200"
          />
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

      {/* Fee explanation */}
      <section className="mx-auto max-w-3xl px-4 pb-16 md:pb-20 w-full">
        <Card className="border-[var(--usj-accent)]/30">
          <CardHeader>
            <div className="mb-1 flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
              <Receipt className="h-5 w-5 text-primary" aria-hidden="true" />
            </div>
            <CardTitle className="text-lg">{t("feeExplanationTitle")}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <p className="text-sm text-slate-700 leading-relaxed">
              {t("feeExplanationDescription", {
                flatFee: flatFeeDisplay,
                percent: feePercentDisplay,
              })}
            </p>
            <p className="text-xs text-slate-500 leading-relaxed">
              {t("feeExplanationNote")}
            </p>
          </CardContent>
        </Card>
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

      {/* Shipping fee calculator */}
      <section id="calculator" className="bg-white scroll-mt-16">
        <div className="mx-auto max-w-6xl px-4 py-16 md:py-20 grid md:grid-cols-2 gap-10 items-start">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-accent mb-2">
              {t("calculatorEyebrow")}
            </p>
            <h2 className="text-2xl md:text-3xl font-bold text-primary mb-4">
              {t("calculatorTitle")}
            </h2>
            <p className="text-slate-600 leading-relaxed">{t("calculatorDescription")}</p>
          </div>
          <FeeCalculator
            rates={shippingRates}
            labels={{
              weightLabel: th("calculator.weightLabel"),
              weightPlaceholder: th("calculator.weightPlaceholder"),
              dimensionsLabel: th("calculator.dimensionsLabel"),
              lengthPlaceholder: th("calculator.lengthPlaceholder"),
              widthPlaceholder: th("calculator.widthPlaceholder"),
              heightPlaceholder: th("calculator.heightPlaceholder"),
              dimensionsHint: th("calculator.dimensionsHint"),
              resultLabel: th("calculator.resultLabel"),
              unavailable: th("calculator.unavailable"),
              disclaimer: th("calculator.disclaimer"),
              currency: th("calculator.currency"),
              overweightContact: th("calculator.overweightContact"),
              jpyApprox: th("calculator.jpyApprox"),
              customsTitle: th("calculator.customsTitle"),
              customsItemPriceLabel: th("calculator.customsItemPriceLabel"),
              customsItemPricePlaceholder: th("calculator.customsItemPricePlaceholder"),
              customsCategoryLabel: th("calculator.customsCategoryLabel"),
              customsCategoryOther: th("calculator.customsCategoryOther"),
              customsCategoryApparel: th("calculator.customsCategoryApparel"),
              customsCategoryFurniture: th("calculator.customsCategoryFurniture"),
              customsCategoryCoffeeTea: th("calculator.customsCategoryCoffeeTea"),
              customsDutyFreeResult: th("calculator.customsDutyFreeResult"),
              customsDutyLabel: th("calculator.customsDutyLabel"),
              customsTaxLabel: th("calculator.customsTaxLabel"),
              customsTotalLabel: th("calculator.customsTotalLabel"),
              customsUnavailable: th("calculator.customsUnavailable"),
              customsDisclaimer: th("calculator.customsDisclaimer"),
              customsLinkLabel: th("calculator.customsLinkLabel"),
            }}
          />
        </div>
      </section>

      {/* FAQ */}
      <section className="bg-[var(--usj-surface)] border-y border-slate-200">
        <div className="mx-auto max-w-3xl px-4 py-16 md:py-20">
          <p className="text-xs font-semibold uppercase tracking-wide text-accent mb-2 text-center">
            {t("faqEyebrow")}
          </p>
          <h2 className="text-2xl md:text-3xl font-bold text-primary mb-10 text-center">
            {t("faqTitle")}
          </h2>
          <div className="space-y-4">
            {faqItems.map((item, i) => (
              <details key={item.question} className="bg-white border border-slate-200 rounded-lg p-5 group">
                <summary className="text-sm font-semibold text-[var(--usj-text)] cursor-pointer list-none flex justify-between items-center gap-4">
                  {item.question}
                  <span className="text-slate-400 group-open:rotate-45 transition-transform text-lg leading-none" aria-hidden="true">
                    +
                  </span>
                </summary>
                <p className="text-sm text-slate-600 mt-3 leading-relaxed">
                  {item.answer}
                  {i === faqItems.length - 1 && (
                    <>
                      {" "}
                      <Link href="/forwarding" className="font-semibold text-primary hover:underline">
                        {t("faqQ4Link")} →
                      </Link>
                    </>
                  )}
                </p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* Contact */}
      <section className="bg-white">
        <div className="mx-auto max-w-4xl px-4 py-16 md:py-20">
          <div className="text-center mb-10">
            <h2 className="text-2xl md:text-3xl font-bold text-primary mb-4">
              {th("contact.title")}
            </h2>
            <p className="text-slate-600 leading-relaxed max-w-2xl mx-auto">
              {th("contact.description")}
            </p>
          </div>
          <div className="grid md:grid-cols-2 gap-6">
            <Card className="border-[#06C755]/30 bg-[#06C755]/5">
              <CardContent className="p-6 flex flex-col items-center text-center gap-3">
                <MessageCircle className="h-8 w-8 text-[#06C755]" aria-hidden="true" />
                <p className="text-sm font-semibold text-[var(--usj-text)]">
                  {th("contact.lineNote")}
                </p>
                <Button
                  asChild
                  size="lg"
                  className="h-auto px-6 py-3 bg-[#06C755] hover:bg-[#05b64c] text-white"
                >
                  <a href="https://lin.ee/Yu1BDaz" target="_blank" rel="noopener noreferrer">
                    {th("contact.lineButton")}
                  </a>
                </Button>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6 flex flex-col justify-center gap-3 text-sm text-slate-600">
                <p className="font-semibold text-[var(--usj-text)]">{th("contact.companyName")}</p>
                <p>{th("contact.companyAddress")}</p>
                <a
                  href="tel:+13103255000"
                  className="flex items-center gap-2 hover:text-primary transition-colors"
                >
                  <Phone className="h-4 w-4 shrink-0" aria-hidden="true" />
                  {th("contact.phoneLabel")}
                </a>
                <a
                  href="mailto:info@usajusho.com"
                  className="flex items-center gap-2 hover:text-primary transition-colors"
                >
                  <Mail className="h-4 w-4 shrink-0" aria-hidden="true" />
                  {th("contact.emailLabel")}
                </a>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="bg-[var(--usj-surface)] border-t border-slate-200">
        <div className="mx-auto max-w-3xl px-4 py-16 md:py-20 text-center w-full">
          <h2 className="text-2xl md:text-3xl font-bold text-primary mb-4">
            {t("finalCtaTitle")}
          </h2>
          <p className="text-slate-600 mb-8">{t("finalCtaDescription")}</p>
          <Button asChild size="lg">
            <Link href="/dashboard/purchase-requests">{t("ctaPrimary")}</Link>
          </Button>
        </div>
      </section>
    </main>
  )
}
