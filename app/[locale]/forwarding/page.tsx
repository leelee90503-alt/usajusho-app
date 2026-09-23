import type { Metadata } from "next";
import { getTranslations } from "next-intl/server"
import { Link } from "@/i18n/navigation"
import { createClient } from "@/lib/supabase/server"
import FeeCalculator from "@/components/home/fee-calculator"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import {
  SignupArt,
  ShopArt,
  DeclareArt,
  WarehouseArt,
  ConsolidateArt,
  ShipArt,
  DeliveredArt,
} from "@/components/how-it-works/step-illustrations"
import {
  ShieldCheck,
  Ban,
  ShoppingCart,
  Receipt,
  MessageCircle,
  Phone,
  Mail,
} from "lucide-react"
import type { ShippingRate } from "@/lib/pricing"

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "seo.forwarding" });
  return {
    title: t("title"),
    description: t("description"),
  };
}

export default async function ForwardingPage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  const isJa = locale === "ja"
  const t = await getTranslations("forwarding")
  const th = await getTranslations("home")

  const supabase = await createClient()
  const { data: rates } = await supabase
    .from("shipping_rates")
    .select("id, label, min_weight_kg, max_weight_kg, price_per_kg, min_charge, is_active, sort_order")
    .eq("is_active", true)
    .order("sort_order", { ascending: true })

  const shippingRates = (rates ?? []) as ShippingRate[]

  const steps = [
    { Art: SignupArt, photo: "/images/forwarding/step-1-signup.webp", title: t("step1Title"), youDo: t("step1YouDo"), weHandle: t("step1WeHandle") },
    { Art: ShopArt, photo: "/images/forwarding/step-2-shop.webp", title: t("step2Title"), youDo: t("step2YouDo"), weHandle: t("step2WeHandle") },
    { Art: DeclareArt, photo: "/images/forwarding/step-3-declare.webp", title: t("step3Title"), youDo: t("step3YouDo"), weHandle: t("step3WeHandle") },
    { Art: WarehouseArt, photo: "/images/forwarding/step-4-warehouse.webp", title: t("step4Title"), youDo: t("step4YouDo"), weHandle: t("step4WeHandle") },
    { Art: ConsolidateArt, photo: "/images/forwarding/step-5-consolidate.webp", title: t("step5Title"), youDo: t("step5YouDo"), weHandle: t("step5WeHandle") },
    { Art: ShipArt, photo: "/images/forwarding/step-6-ship.webp", title: t("step6Title"), youDo: t("step6YouDo"), weHandle: t("step6WeHandle") },
    { Art: DeliveredArt, photo: "/images/forwarding/step-7-delivered.webp", title: t("step7Title"), youDo: t("step7YouDo"), weHandle: t("step7WeHandle") },
  ]

  const checklist = [
    {
      key: "checklistCustoms",
      Icon: Receipt,
      photo: "/images/forwarding/checklist-customs-calculator.webp",
      href: "/customs",
    },
    {
      key: "checklistQuantity",
      Icon: ShieldCheck,
      photo: "/images/forwarding/checklist-vitamin-limit.webp",
      href: "/customs",
    },
    {
      key: "checklistProhibited",
      Icon: Ban,
      photo: "/images/forwarding/checklist-prohibited-items.webp",
      href: "/customs",
    },
    {
      key: "checklistPurchase",
      Icon: ShoppingCart,
      photo: "/images/forwarding/checklist-purchase-agency.webp",
      href: "/purchase-agency",
    },
  ]

  const faqItems = [
    { question: t("faqNewQ1Question"), answer: t("faqNewQ1Answer") },
    { question: t("faqNewQ2Question"), answer: t("faqNewQ2Answer") },
    { question: t("faqNewQ3Question"), answer: t("faqNewQ3Answer") },
    { question: th("faq.q2Question"), answer: th("faq.q2Answer") },
    { question: th("faq.q3Question"), answer: th("faq.q3Answer") },
    { question: th("faq.q5Question"), answer: th("faq.q5Answer") },
    { question: th("faq.q6Question"), answer: th("faq.q6Answer") },
  ]

  return (
    <div>
      {/* 1. Hero */}
      <section className="bg-[var(--usj-surface)] border-b border-slate-200">
        <div className="mx-auto max-w-4xl px-4 py-16 text-center">
          <span className="inline-block rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-primary mb-4">
            {t("eyebrow")}
          </span>
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-[var(--usj-text)] mb-4">
            {t("title")}
          </h1>
          <p className="text-slate-600 max-w-2xl mx-auto leading-relaxed mb-8">
            {t("description")}
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3">
            <Button asChild size="lg">
              <Link href="/signup">{t("ctaPrimary")}</Link>
            </Button>
            <Button asChild size="lg" variant="outline">
              <a href="#calculator">{t("ctaSecondary")}</a>
            </Button>
          </div>
        </div>
      </section>

      {/* 2. 7-step process */}
      <section className="mx-auto max-w-5xl px-4 py-16">
        <div className="max-w-2xl mx-auto text-center mb-12">
          <p className="text-xs font-semibold uppercase tracking-wide text-accent mb-2">
            {t("stepsEyebrow")}
          </p>
          <h2 className="text-2xl md:text-3xl font-bold text-primary mb-3">
            {t("stepsTitle")}
          </h2>
          <p className="text-slate-600 leading-relaxed">{t("stepsDescription")}</p>
        </div>
        <div className="space-y-14">
          {steps.map((step, i) => {
            const Art = step.Art
            const reversed = i % 2 === 1
            return (
              <div
                key={step.title}
                className={`flex flex-col items-center gap-8 md:gap-12 ${
                  reversed ? "md:flex-row-reverse" : "md:flex-row"
                }`}
              >
                <div className="w-full md:w-1/2 flex justify-center">
                  <div className="w-full max-w-[280px] rounded-2xl bg-[var(--usj-surface)] p-4 overflow-hidden">
                    {isJa ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={step.photo} alt={step.title} className="w-full h-auto rounded-lg" />
                    ) : (
                      <Art className="w-full h-auto" />
                    )}
                  </div>
                </div>
                <div className="w-full md:w-1/2">
                  <div className="flex items-center gap-3 mb-3">
                    <Badge className="h-7 w-7 shrink-0 justify-center rounded-full p-0 text-sm">{i + 1}</Badge>
                    <h3 className="text-xl font-semibold text-[var(--usj-text)]">{step.title}</h3>
                  </div>
                  <div className="space-y-3 pl-10">
                    <p className="text-sm text-slate-600">
                      <span className="font-semibold text-[var(--usj-primary)]">{t("youDoLabel")}: </span>
                      {step.youDo}
                    </p>
                    <p className="text-sm text-slate-600">
                      <span className="font-semibold text-[var(--usj-accent)]">{t("weHandleLabel")}: </span>
                      {step.weHandle}
                    </p>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </section>

      {/* 2b. Free warehouse inspection & photo-sharing proof (real photo, both locales) */}
      <section className="bg-[var(--usj-surface)] border-y border-slate-200">
        <div className="mx-auto max-w-5xl px-4 py-16 md:py-20 grid md:grid-cols-2 gap-10 items-center">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-accent mb-2">
              {t("warehouseEyebrow")}
            </p>
            <h2 className="text-2xl md:text-3xl font-bold text-primary mb-4">
              {t("warehouseTitle")}
            </h2>
            <p className="text-slate-600 leading-relaxed">{t("warehouseDescription")}</p>
          </div>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/images/forwarding/warehouse-inspection.webp"
            alt={t("warehouseAlt")}
            className="w-full h-auto rounded-lg border border-slate-200"
          />
        </div>
      </section>

      {/* 3. Real shipping-label example (bilingual photo, both locales) */}
      <section className="bg-white border-y border-slate-200">
        <div className="mx-auto max-w-4xl px-4 py-16 md:py-20 grid md:grid-cols-2 gap-10 items-center">
          <div className="order-2 md:order-1">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/images/forwarding/address-label-example.webp"
              alt={t("addressExampleAlt")}
              className="w-full h-auto rounded-lg border border-slate-200"
            />
          </div>
          <div className="order-1 md:order-2">
            <h2 className="text-2xl md:text-3xl font-bold text-primary mb-4">
              {t("addressExampleTitle")}
            </h2>
            <p className="text-slate-600 leading-relaxed">{t("addressExampleDescription")}</p>
          </div>
        </div>
      </section>

      {/* 4. Consolidation bonus */}
      <section className="bg-[var(--usj-surface)] border-b border-slate-200">
        <div className="mx-auto max-w-5xl px-4 py-16 md:py-20 grid md:grid-cols-2 gap-10 items-center">
          <div>
            <h2 className="text-2xl md:text-3xl font-bold text-primary mb-4">
              {t("consolidationTitle")}
            </h2>
            <p className="text-slate-600 leading-relaxed">{t("consolidationDescription")}</p>
          </div>
          {isJa ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src="/images/forwarding/consolidation-before-after.webp"
              alt={t("consolidationAlt")}
              className="w-full h-auto rounded-lg border border-slate-200 bg-white"
            />
          ) : (
            <div className="bg-white border border-slate-200 rounded-lg p-6">
              <ConsolidateArt className="w-full h-auto max-w-[240px] mx-auto" />
            </div>
          )}
        </div>
      </section>

      {/* 5. Before-you-ship checklist */}
      <section className="bg-white">
        <div className="mx-auto max-w-6xl px-4 py-16 md:py-20">
          <div className="max-w-2xl mb-12">
            <p className="text-xs font-semibold uppercase tracking-wide text-accent mb-2">
              {t("checklistEyebrow")}
            </p>
            <h2 className="text-2xl md:text-3xl font-bold text-primary mb-3">
              {t("checklistTitle")}
            </h2>
            <p className="text-slate-600 leading-relaxed">{t("checklistDescription")}</p>
          </div>
          <div className="grid gap-5 sm:grid-cols-2">
            {checklist.map(({ key, Icon, photo, href }) => (
              <Card key={key} className="overflow-hidden">
                {isJa ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={photo} alt="" className="w-full h-auto" />
                ) : (
                  <div className="flex items-center justify-center h-32 bg-[var(--usj-surface)]">
                    <Icon className="h-10 w-10 text-primary" aria-hidden="true" />
                  </div>
                )}
                <CardContent>
                  <p className="text-sm font-semibold text-[var(--usj-text)] mb-1.5">
                    {t(`${key}Title`)}
                  </p>
                  <p className="text-xs text-slate-500 leading-relaxed mb-3">
                    {t(`${key}Description`)}
                  </p>
                  <Link href={href} className="text-xs font-semibold text-primary hover:underline">
                    {t(`${key}Link`)} →
                  </Link>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* 6. Shipping fee calculator */}
      <section id="calculator" className="bg-[var(--usj-surface)] border-y border-slate-200 scroll-mt-16">
        <div className="mx-auto max-w-6xl px-4 py-16 md:py-20 grid md:grid-cols-2 gap-10 items-start">
          <div>
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
              insuranceTitle: th("calculator.insuranceTitle"),
              insuranceResultLabel: th("calculator.insuranceResultLabel"),
              insuranceFreeResult: th("calculator.insuranceFreeResult"),
              insuranceUnavailable: th("calculator.insuranceUnavailable"),
              insuranceOverLimit: th("calculator.insuranceOverLimit"),
              insuranceDisclaimer: th("calculator.insuranceDisclaimer"),
            }}
          />
        </div>
      </section>

      {/* 7. FAQ */}
      <section className="bg-white">
        <div className="mx-auto max-w-3xl px-4 py-16 md:py-20">
          <p className="text-xs font-semibold uppercase tracking-wide text-accent mb-2 text-center">
            {t("faqEyebrow")}
          </p>
          <h2 className="text-2xl md:text-3xl font-bold text-primary mb-10 text-center">
            {t("faqTitle")}
          </h2>
          <div className="space-y-4">
            {faqItems.map((item) => (
              <details key={item.question} className="bg-[var(--usj-surface)] border border-slate-200 rounded-lg p-5 group">
                <summary className="text-sm font-semibold text-[var(--usj-text)] cursor-pointer list-none flex justify-between items-center gap-4">
                  {item.question}
                  <span className="text-slate-400 group-open:rotate-45 transition-transform text-lg leading-none" aria-hidden="true">
                    +
                  </span>
                </summary>
                <p className="text-sm text-slate-600 mt-3 leading-relaxed">{item.answer}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* 8. Contact */}
      <section className="bg-[var(--usj-surface)] border-y border-slate-200">
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
            <Card className="bg-white">
              <CardContent className="p-6 flex flex-col justify-center gap-3 text-sm text-slate-600">
                <p className="font-semibold text-[var(--usj-text)]">{th("contact.companyName")}</p>
                <p>{th("contact.companyAddress")}</p>
                <p>{th("contact.companyAddress2")}</p>
                <p>{th("contact.companyAddress3")}</p>
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

      {/* 9. Signup CTA */}
      <section className="bg-white">
        <div className="mx-auto max-w-3xl px-4 py-16 text-center">
          <h2 className="text-2xl font-bold text-[var(--usj-text)] mb-3">{t("ctaTitle")}</h2>
          <p className="text-slate-600 mb-6">{t("ctaDescription")}</p>
          <Button asChild size="lg">
            <Link href="/signup">{t("ctaButton")}</Link>
          </Button>
        </div>
      </section>
    </div>
  )
}
