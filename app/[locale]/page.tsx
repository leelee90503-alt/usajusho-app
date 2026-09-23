import type { Metadata } from "next";
import { getTranslations } from "next-intl/server"
import { Link } from "@/i18n/navigation"
import { createClient } from "@/lib/supabase/server"
import FeeCalculator from "@/components/home/fee-calculator"
import DeliveryJourney from "@/components/home/delivery-journey"
import HeroSlideshow from "@/components/home/hero-slideshow"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import {
  Search,
  PackageCheck,
  Receipt,
  Archive,
  ShieldCheck,
  Settings2,
  MessageCircle,
  Phone,
  Mail,
  Clock,
  CreditCard,
  Languages,
  TrendingDown,
  Layers,
  DollarSign,
  Send,
  CircleCheck,
  X,
  Umbrella,
  type LucideIcon,
} from "lucide-react"
import type { ShippingRate } from "@/lib/pricing"
import { getPurchaseAgencyPublicFeeSettings } from "@/lib/purchase-agency-settings"
import { formatUSD, formatApproxJPY } from "@/lib/format"

const addonIcons: Record<string, LucideIcon> = {
  item1: Search,
  item2: PackageCheck,
  item3: Receipt,
  item4: Archive,
  item5: ShieldCheck,
  item6: Settings2,
}

// Representative US shopping sites shown in the homepage hero's "supported
// shops" ticker. This is an example list, not an allowlist -- any US site
// with an address can generally be forwarded, which is why the ticker ends
// on shopBand.moreLabel ("and many more") rather than implying these are
// the only sites we support.
const SUPPORTED_SHOPS = [
  "amazon.com",
  "iherb.com",
  "ebay.com",
  "ralphlauren.com",
  "gap.com",
  "oldnavy.gap.com",
  "jomashop.com",
  "shopbop.com",
  "macys.com",
  "6pm.com",
]


export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "seo.home" });
  return {
    title: t("title"),
    description: t("description"),
  };
}

export default async function Home() {
  const t = await getTranslations("home")
  const tc = await getTranslations("common")

  const supabase = await createClient()
  const { data: rates } = await supabase
    .from("shipping_rates")
    .select("id, label, min_weight_kg, max_weight_kg, price_per_kg, min_charge, is_active, sort_order")
    .eq("is_active", true)
    .order("sort_order", { ascending: true })

  const shippingRates = (rates ?? []) as ShippingRate[]

  const feeSettings = await getPurchaseAgencyPublicFeeSettings()
  const exampleItemPrice = 100
  const examplePercentFee = exampleItemPrice * feeSettings.feePercent
  const exampleFlatFee = feeSettings.flatFeeCents / 100
  const exampleFeeTotal = exampleFlatFee + examplePercentFee
  const exampleGrandTotal = exampleItemPrice + exampleFeeTotal
  const feeExampleValues = {
    itemPrice: `$${formatUSD(exampleItemPrice)}`,
    flatFee: `$${formatUSD(exampleFlatFee)}`,
    percent: `${Math.round(feeSettings.feePercent * 100)}%`,
    percentFee: `$${formatUSD(examplePercentFee)}`,
    feeTotal: `$${formatUSD(exampleFeeTotal)}`,
    grandTotal: `$${formatUSD(exampleGrandTotal)}`,
    grandTotalJpy: formatApproxJPY(exampleGrandTotal),
  }

  return (
    <main className="flex flex-col">
      {/* 2. Hero -- boxed to the same max-w-6xl content column as every
          section below (not a full-bleed banner), so its left/right edges
          line up with the rest of the page instead of running edge to
          edge on wide screens. */}
      <section>
        <HeroSlideshow
          slides={[
            {
              image: "/images/hero-bg-v2.webp",
              eyebrow: t("hero.eyebrow"),
              headline: t("hero.headline"),
              description: t("hero.description"),
            },
            {
              image: "/images/hero-bg-no-hidden-fees.webp",
              eyebrow: t("hero.slide2Eyebrow"),
              headline: t("hero.slide2Headline"),
              description: t("hero.slide2Description"),
            },
          ]}
          ctaPrimaryText={t("hero.ctaPrimary")}
          ctaSecondaryText={t("hero.ctaSecondary")}
          trustNote={t("hero.trustNote")}
        />
      </section>

      {/* 2b. Supported shops ticker -- boxed to the same max-w-6xl column
          as the hero above it, with zero margin between them so the two
          cards sit flush against each other. */}
      <section>
        <div className="rounded-2xl bg-[var(--usj-surface)] mx-auto max-w-6xl px-0 py-7 md:py-8 overflow-hidden">
          <div className="px-4 text-center mb-4">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
              {t("shopBand.eyebrow")}
            </p>
            <p className="text-base md:text-lg font-bold text-[var(--usj-text)] mt-1">
              {t("shopBand.title")}
            </p>
            <p className="text-xs text-slate-500 mt-1">{t("shopBand.note")}</p>
          </div>
          <div
            className="shop-ticker-mask overflow-hidden"
            style={{
              maskImage:
                "linear-gradient(to right, transparent 0, #000 64px, #000 calc(100% - 64px), transparent 100%)",
              WebkitMaskImage:
                "linear-gradient(to right, transparent 0, #000 64px, #000 calc(100% - 64px), transparent 100%)",
            }}
          >
            <div className="shop-ticker-track flex w-max gap-3">
              {[0, 1].map((dup) => (
                <div key={dup} className="flex gap-3 pr-3">
                  {SUPPORTED_SHOPS.map((shop) => (
                    <span
                      key={`${dup}-${shop}`}
                      className="inline-flex flex-none items-center gap-2 rounded-full border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-[var(--usj-text)] whitespace-nowrap"
                    >
                      <span className="h-1.5 w-1.5 rounded-full bg-[var(--usj-accent)]" />
                      {shop}
                    </span>
                  ))}
                  <span className="inline-flex flex-none items-center rounded-full border border-dashed border-slate-300 px-4 py-2 text-sm italic text-slate-500 whitespace-nowrap">
                    {t("shopBand.moreLabel")}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* 3. Trust indicators */}
      <section>
        <div className="mx-auto max-w-6xl px-4 py-10 grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
          <div>
            <p className="text-2xl font-bold text-primary">{t("trust.stat1Value")}</p>
            <p className="text-xs text-slate-500 mt-1">{t("trust.stat1Label")}</p>
          </div>
          <div>
            <p className="text-2xl font-bold text-primary">{t("trust.stat2Value")}</p>
            <p className="text-xs text-slate-500 mt-1">{t("trust.stat2Label")}</p>
          </div>
          <div>
            <p className="text-2xl font-bold text-primary">{t("trust.stat3Value")}</p>
            <p className="text-xs text-slate-500 mt-1">{t("trust.stat3Label")}</p>
          </div>
          <div>
            <p className="text-2xl font-bold text-primary">{t("trust.stat4Value")}</p>
            <p className="text-xs text-slate-500 mt-1">{t("trust.stat4Label")}</p>
          </div>
        </div>
      </section>

      {/* 3.5 Purchase agency highlight (no US card needed) */}
      <section className="bg-white">
        <div className="mx-auto max-w-6xl px-4 py-16 md:py-20 grid md:grid-cols-2 gap-10 items-center">
          <div>
            <p className="text-[var(--usj-accent)] font-semibold text-sm mb-3 tracking-wide">
              {t("purchaseAgencyHighlight.eyebrow")}
            </p>
            <h2 className="text-2xl md:text-3xl font-bold text-primary mb-4">
              {t("purchaseAgencyHighlight.title")}
            </h2>
            <p className="text-slate-600 leading-relaxed mb-6">
              {t("purchaseAgencyHighlight.description")}
            </p>
            <Button asChild size="lg">
              <Link href="/purchase-agency">{t("purchaseAgencyHighlight.ctaLabel")}</Link>
            </Button>
          </div>
          <div className="bg-surface border border-slate-200 rounded-lg p-6">
            <p className="text-xs text-slate-400 tracking-wide mb-3">
              {t("purchaseAgencyHighlight.feeExampleLabel")}
            </p>
            <p className="text-sm text-[var(--usj-text)] leading-relaxed">
              {t("purchaseAgencyHighlight.feeExampleText", feeExampleValues)}
            </p>
          </div>
        </div>
      </section>

      {/* 4. Illustrated delivery process */}
      <section className="bg-white">
        <div className="mx-auto max-w-6xl px-4 py-16 md:py-20">
          <div className="max-w-2xl mb-12">
            <h2 className="text-2xl md:text-3xl font-bold text-primary mb-3">
              {t("journey.title")}
            </h2>
            <p className="text-slate-600 leading-relaxed">{t("journey.description")}</p>
          </div>
          <DeliveryJourney
            steps={[
              { title: t("journey.step1Title"), description: t("journey.step1Description") },
              { title: t("journey.step2Title"), description: t("journey.step2Description") },
              { title: t("journey.step3Title"), description: t("journey.step3Description") },
              { title: t("journey.step4Title"), description: t("journey.step4Description") },
              { title: t("journey.step5Title"), description: t("journey.step5Description") },
              { title: t("journey.step6Title"), description: t("journey.step6Description") },
              { title: t("journey.step7Title"), description: t("journey.step7Description") },
            ]}
          />
        </div>
      </section>

      {/* 5. US warehouse address explanation */}
      <section className="bg-surface border-y border-slate-200">
        <div className="mx-auto max-w-6xl px-4 py-16 md:py-20 grid md:grid-cols-2 gap-10 items-center">
          <div>
            <h2 className="text-2xl md:text-3xl font-bold text-primary mb-4">
              {t("address.title")}
            </h2>
            <p className="text-slate-600 leading-relaxed mb-6">{t("address.description")}</p>
            <ul className="space-y-3">
              <li className="flex gap-3 text-sm text-slate-700">
                <span className="text-accent font-bold">01</span>
                {t("address.point1")}
              </li>
              <li className="flex gap-3 text-sm text-slate-700">
                <span className="text-accent font-bold">02</span>
                {t("address.point2")}
              </li>
              <li className="flex gap-3 text-sm text-slate-700">
                <span className="text-accent font-bold">03</span>
                {t("address.point3")}
              </li>
            </ul>
          </div>
          <div className="bg-white border border-slate-200 rounded-lg p-6 font-mono text-sm text-[var(--usj-text)] leading-loose">
            <p className="text-xs text-slate-400 font-sans mb-3 tracking-wide">
              {t("address.sampleLabel")}
            </p>
            <p>{t("address.sampleName")}</p>
            <p>{t("address.sampleLine1")}</p>
            <p>{t("address.sampleLine2")}</p>
            <p>{t("address.sampleLine3")}</p>
          </div>
        </div>
      </section>

      {/* 6. Package photo inspection guide */}
      <section className="bg-white">
        <div className="mx-auto max-w-6xl px-4 py-16 md:py-20 grid md:grid-cols-2 gap-10 items-center">
          <div className="order-2 md:order-1 grid grid-cols-2 gap-3">
            <img
              src="/images/inspection-exterior.png"
              alt={t("inspection.exteriorAlt")}
              className="aspect-square rounded-lg bg-surface border border-slate-200 object-cover w-full"
            />
            <img
              src="/images/inspection-interior.png"
              alt={t("inspection.interiorAlt")}
              className="aspect-square rounded-lg bg-surface border border-slate-200 object-cover w-full mt-6"
            />
          </div>
          <div className="order-1 md:order-2">
            <h2 className="text-2xl md:text-3xl font-bold text-primary mb-4">
              {t("inspection.title")}
            </h2>
            <p className="text-slate-600 leading-relaxed">{t("inspection.description")}</p>
          </div>
        </div>
      </section>

      {/* 7. Consolidation / repackaging guide */}
      <section className="bg-surface border-y border-slate-200">
        <div className="mx-auto max-w-6xl px-4 py-16 md:py-20 grid md:grid-cols-2 gap-10 items-center">
          <div>
            <div className="flex flex-wrap items-center gap-2 mb-4">
              <h2 className="text-2xl md:text-3xl font-bold text-primary">
                {t("consolidation.title")}
              </h2>
              <span className="inline-flex items-center rounded-full bg-emerald-50 text-emerald-700 text-xs font-extrabold px-3 py-1 whitespace-nowrap">
                {t("consolidation.freeBadge")}
              </span>
            </div>
            <p className="text-slate-600 leading-relaxed">{t("consolidation.description")}</p>
          </div>
          <div className="bg-white border border-slate-200 rounded-lg p-6">
            <div className="mb-3">
              <img
                src="/images/consolidation-flow.png"
                alt={t("consolidation.flowAlt")}
                className="w-full h-auto"
              />
            </div>
            <p className="text-sm text-[var(--usj-text)] font-medium">{t("consolidation.exampleLabel")}</p>
            <p className="text-xs text-slate-500 mt-1">{t("consolidation.exampleNote")}</p>
          </div>
        </div>
      </section>

      {/* 8. Add-on services guide */}
      <section className="bg-white">
        <div className="mx-auto max-w-6xl px-4 py-16 md:py-20">
          <div className="max-w-2xl mb-10">
            <h2 className="text-2xl md:text-3xl font-bold text-primary mb-3">
              {t("addons.title")}
            </h2>
            <p className="text-slate-600 leading-relaxed">{t("addons.description")}</p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {["item1", "item2", "item3", "item4", "item5", "item6"].map((key) => {
              const Icon = addonIcons[key]
              return (
                <Card key={key} className="hover:shadow-md transition-shadow">
                  <CardContent>
                    <div className="mb-3 flex size-9 items-center justify-center rounded-md bg-accent/10 text-accent">
                      <Icon className="size-5" aria-hidden="true" />
                    </div>
                    <p className="text-sm font-semibold text-[var(--usj-text)] mb-1">
                      {t(`addons.${key}Title`)}
                    </p>
                    <p className="text-xs text-slate-500 leading-relaxed">{t(`addons.${key}Description`)}</p>
                  </CardContent>
                </Card>
              )
            })}
          </div>
          <p className="text-xs text-slate-500 mt-6">{t("addons.footnote")}</p>
        </div>
      </section>

      {/* 8.5 Comparison with international couriers */}
      <section className="border-y border-slate-200">
        <div className="mx-auto max-w-6xl px-4 py-16 md:py-20">
          {/* Hero row -- eyebrow/heading/lead/benefits on the left, boxes photo on the right */}
          <div className="grid md:grid-cols-[1.45fr_0.75fr] gap-8 md:gap-10 items-center">
            <div>
              <p className="text-xs font-extrabold tracking-[0.2em] text-sky-600 mb-3">
                {t("comparison.eyebrow")}
              </p>
              <h2 className="text-3xl md:text-5xl font-bold text-primary leading-[1.05] tracking-tight mb-4">
                {t("comparison.title")}
              </h2>
              <p className="text-slate-500 text-base md:text-lg leading-snug max-w-xl">
                {t("comparison.description")}
              </p>
              <div className="flex flex-wrap gap-x-8 gap-y-4 mt-6">
                {[
                  { key: "benefit1Text", Icon: Layers },
                  { key: "benefit2Text", Icon: DollarSign },
                  { key: "benefit3Text", Icon: Send },
                ].map(({ key, Icon }) => (
                  <div key={key} className="flex items-center gap-3 max-w-[160px]">
                    <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-sky-50 text-sky-700">
                      <Icon className="h-5 w-5" aria-hidden="true" />
                    </span>
                    <span className="text-sm font-bold text-[var(--usj-text)] leading-tight">
                      {t(`comparison.${key}`)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/images/comparison-boxes.webp"
              alt=""
              className="w-full max-h-[220px] object-contain"
            />
          </div>

          {/* Price example -- best-value USAJUSHO card vs. the USPS competitor card */}
          <div className="relative grid sm:grid-cols-2 gap-3 mt-10">
            <div className="relative overflow-hidden rounded-2xl px-6 py-7 sm:px-8 text-white bg-gradient-to-br from-[#123b79] to-[#0050a8] grid grid-cols-[0.8fr_1.2fr] items-center gap-4">
              <span className="absolute top-0 left-6 rounded-b-lg bg-[#ff6868] px-4 py-1.5 text-[11px] font-extrabold tracking-wide">
                {t("comparison.bestValueBadge")}
              </span>
              <div className="text-center pt-4">
                <p className="text-lg font-extrabold tracking-tight">USAJUSHO</p>
              </div>
              <div>
                <p className="text-4xl md:text-5xl font-bold leading-none">
                  {t("comparison.priceExampleUsajushoValue")}
                </p>
                <p className="text-lg mt-1.5 text-white/85">
                  {t("comparison.priceExampleUsajushoJpy")}
                </p>
                <p className="text-xs mt-1.5 text-white/80">
                  {t("comparison.priceExampleUsajushoLabel")}
                </p>
              </div>
            </div>

            <div className="relative overflow-hidden rounded-2xl px-6 py-7 sm:px-8 bg-[#f3f7fc] grid grid-cols-[0.8fr_1.2fr] items-center gap-4">
              <span className="absolute right-4 top-4 inline-flex items-center gap-1 rounded-full bg-emerald-50 text-emerald-700 text-xs font-extrabold px-3 py-1.5 whitespace-nowrap">
                <TrendingDown className="h-3.5 w-3.5" aria-hidden="true" />
                {t("comparison.savingsBadge")}
              </span>
              <div className="text-center pt-4">
                <p className="text-lg font-extrabold tracking-tight text-slate-500">USPS</p>
              </div>
              <div>
                <p className="text-4xl md:text-5xl font-bold text-slate-400 leading-none">
                  {t("comparison.priceExampleOthersValue")}
                </p>
                <p className="text-lg mt-1.5 text-slate-400">
                  {t("comparison.priceExampleOthersJpy")}
                </p>
                <p className="text-xs mt-1.5 text-slate-500">
                  {t("comparison.priceExampleOthersLabel")}
                </p>
              </div>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/images/usps-priority-mail-box.webp"
                alt="USPS Priority Mail box"
                className="hidden md:block absolute bottom-2 right-2 w-20 object-contain opacity-90"
              />
            </div>

            <div className="hidden sm:flex absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 h-14 w-14 items-center justify-center rounded-full bg-white shadow-lg text-sm font-black text-slate-600 z-10">
              VS
            </div>
          </div>

          <p className="text-xs text-slate-400 mt-4 text-center max-w-3xl mx-auto leading-relaxed">
            {t("comparison.priceExampleNote")}
          </p>

          {/* Carrier-by-carrier chips -- same 3kg package, glanceable */}
          <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wide mt-8 mb-3 text-center">
            {t("comparison.carrierCompareLabel")}
          </p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { key: "carrierUsajusho", logo: null },
              { key: "carrierUsps", logo: "/images/carrier-usps-logo.webp" },
              { key: "carrierUps", logo: "/images/carrier-ups-logo.webp" },
              { key: "carrierDhl", logo: "/images/carrier-dhl-logo.webp" },
            ].map(({ key, logo }) => (
              <div
                key={key}
                className={`rounded-xl border px-4 py-3 text-center ${
                  key === "carrierUsajusho"
                    ? "bg-sky-50 border-sky-200"
                    : "bg-white border-slate-200"
                }`}
              >
                {logo ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={logo}
                    alt=""
                    className="h-5 mx-auto mb-1.5 object-contain"
                  />
                ) : (
                  <p className="text-sm font-bold text-primary">
                    {t(`comparison.${key}`).split(" — ")[0]}
                  </p>
                )}
                <p className="text-xs text-slate-500 mt-0.5">
                  {t(`comparison.${key}`).split(" — ")[1]}
                </p>
              </div>
            ))}
          </div>

          {/* No hidden fees -- $0 badges + what other forwarders often charge instead */}
          <div className="mt-8 rounded-2xl border border-emerald-200 bg-emerald-50/60 p-5 sm:p-6">
            <p className="text-[11px] font-semibold text-emerald-700 uppercase tracking-wide mb-3 text-center">
              {t("comparison.noHiddenFeesLabel")}
            </p>
            <div className="grid grid-cols-3 gap-3">
              {["noHiddenFeeInspection", "noHiddenFeeReceiving", "noHiddenFeeConsolidation"].map(
                (key) => (
                  <div
                    key={key}
                    className="rounded-xl bg-white border border-emerald-200 px-3 py-3 text-center"
                  >
                    <p className="flex items-center justify-center gap-1 text-lg font-extrabold text-emerald-600">
                      <CircleCheck className="h-4 w-4 shrink-0" aria-hidden="true" />
                      $0
                    </p>
                    <p className="text-xs text-slate-500 mt-0.5">{t(`comparison.${key}`)}</p>
                  </div>
                )
              )}
            </div>

            <div className="mt-5 pt-5 border-t border-emerald-200/70">
              <p className="text-sm font-bold text-[var(--usj-text)] mb-1.5">
                {t("comparison.hiddenFeesTitle")}
              </p>
              <p className="text-xs text-slate-500 mb-3">{t("comparison.hiddenFeesIntro")}</p>
              <div className="grid sm:grid-cols-2 gap-2.5">
                {["hiddenFeesItem1", "hiddenFeesItem2", "hiddenFeesItem3", "hiddenFeesItem4"].map(
                  (key) => (
                    <div
                      key={key}
                      className="flex items-start gap-2 bg-white/70 rounded-lg px-3 py-2.5"
                    >
                      <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-rose-100 mt-0.5">
                        <X className="h-3.5 w-3.5 text-rose-500" strokeWidth={3} aria-hidden="true" />
                      </span>
                      <div>
                        <p className="text-xs font-bold text-[var(--usj-text)]">
                          {t(`comparison.${key}Label`)}
                        </p>
                        <p className="text-[11px] text-slate-400 leading-snug">
                          {t(`comparison.${key}Desc`)}
                        </p>
                      </div>
                    </div>
                  )
                )}
              </div>
              <p className="text-[11px] text-slate-400 mt-3">{t("comparison.hiddenFeesNote")}</p>
            </div>
          </div>

          {/* Compact feature comparison -- short, icon-led, scannable at a glance */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 mt-4">
            {[
              { key: "row1", Icon: Clock },
              { key: "row2", Icon: ShieldCheck },
              { key: "row3", Icon: CreditCard },
              { key: "row4", Icon: Languages },
              { key: "row5", Icon: Umbrella },
            ].map(({ key, Icon }) => (
              <div key={key} className="bg-white border border-slate-200 rounded-xl p-4">
                <p className="flex items-center gap-2 text-sm font-bold text-[var(--usj-text)]">
                  <Icon className="h-4 w-4 text-primary shrink-0" aria-hidden="true" />
                  {t(`comparison.${key}Label`)}
                </p>
                <p className="text-sm text-primary mt-2">{t(`comparison.${key}Usajusho`)}</p>
                <p className="text-xs text-slate-400 mt-1">{t(`comparison.${key}Others`)}</p>
              </div>
            ))}
          </div>

          <p className="text-xs text-slate-500 mt-6 text-center max-w-3xl mx-auto leading-relaxed">
            {t("comparison.footnote")}
          </p>
        </div>
      </section>

      {/* 9. Shipping fee calculator */}
      <section id="calculator" className="bg-surface border-y border-slate-200 scroll-mt-16">
        <div className="mx-auto max-w-6xl px-4 py-16 md:py-20 grid md:grid-cols-2 gap-10 items-start">
          <div>
            <h2 className="text-2xl md:text-3xl font-bold text-primary mb-4">
              {t("calculator.title")}
            </h2>
            <p className="text-slate-600 leading-relaxed">{t("calculator.description")}</p>
          </div>
          <FeeCalculator
            rates={shippingRates}
            labels={{
              weightLabel: t("calculator.weightLabel"),
              weightPlaceholder: t("calculator.weightPlaceholder"),
              dimensionsLabel: t("calculator.dimensionsLabel"),
              lengthPlaceholder: t("calculator.lengthPlaceholder"),
              widthPlaceholder: t("calculator.widthPlaceholder"),
              heightPlaceholder: t("calculator.heightPlaceholder"),
              dimensionsHint: t("calculator.dimensionsHint"),
              resultLabel: t("calculator.resultLabel"),
              unavailable: t("calculator.unavailable"),
              disclaimer: t("calculator.disclaimer"),
              currency: t("calculator.currency"),
              overweightContact: t("calculator.overweightContact"),
              jpyApprox: t("calculator.jpyApprox"),
              customsTitle: t("calculator.customsTitle"),
              customsItemPriceLabel: t("calculator.customsItemPriceLabel"),
              customsItemPricePlaceholder: t("calculator.customsItemPricePlaceholder"),
              customsCategoryLabel: t("calculator.customsCategoryLabel"),
              customsCategoryOther: t("calculator.customsCategoryOther"),
              customsCategoryApparel: t("calculator.customsCategoryApparel"),
              customsCategoryFurniture: t("calculator.customsCategoryFurniture"),
              customsCategoryCoffeeTea: t("calculator.customsCategoryCoffeeTea"),
              customsDutyFreeResult: t("calculator.customsDutyFreeResult"),
              customsDutyLabel: t("calculator.customsDutyLabel"),
              customsTaxLabel: t("calculator.customsTaxLabel"),
              customsTotalLabel: t("calculator.customsTotalLabel"),
              customsUnavailable: t("calculator.customsUnavailable"),
              customsDisclaimer: t("calculator.customsDisclaimer"),
              customsLinkLabel: t("calculator.customsLinkLabel"),
              insuranceTitle: t("calculator.insuranceTitle"),
              insuranceResultLabel: t("calculator.insuranceResultLabel"),
              insuranceFreeResult: t("calculator.insuranceFreeResult"),
              insuranceUnavailable: t("calculator.insuranceUnavailable"),
              insuranceOverLimit: t("calculator.insuranceOverLimit"),
              insuranceDisclaimer: t("calculator.insuranceDisclaimer"),
            }}
          />
        </div>
      </section>

      {/* 10. Tracking / delivery completion guide */}
      <section className="bg-white">
        <div className="mx-auto max-w-6xl px-4 py-16 md:py-20 grid md:grid-cols-2 gap-10 items-center">
          <div>
            <h2 className="text-2xl md:text-3xl font-bold text-primary mb-4">
              {t("tracking.title")}
            </h2>
            <p className="text-slate-600 leading-relaxed">{t("tracking.description")}</p>
          </div>
          <div className="bg-surface border border-slate-200 rounded-lg p-6">
            <div className="flex items-center gap-2 mb-4">
              {[0, 1, 2, 3].map((i) => (
                <div key={i} className="flex items-center flex-1 last:flex-none">
                  <div
                    className={`w-3 h-3 rounded-full ${i <= 2 ? "bg-accent" : "bg-slate-300"}`}
                    aria-hidden="true"
                  />
                  {i < 3 && (
                    <div className={`h-0.5 flex-1 ${i < 2 ? "bg-accent" : "bg-slate-300"}`} aria-hidden="true" />
                  )}
                </div>
              ))}
            </div>
            <p className="text-sm font-medium text-[var(--usj-text)]">{t("tracking.exampleStatus")}</p>
            <p className="text-xs text-slate-500 mt-1">{t("tracking.exampleNote")}</p>
          </div>
        </div>
      </section>

      {/* 11. FAQ */}
      <section className="bg-surface border-y border-slate-200">
        <div className="mx-auto max-w-3xl px-4 py-16 md:py-20">
          <h2 className="text-2xl md:text-3xl font-bold text-primary mb-10 text-center">
            {t("faq.title")}
          </h2>
          <div className="space-y-4">
            {["q1", "q2", "q3", "q4", "q5", "q6"].map((key) => (
              <details key={key} className="bg-white border border-slate-200 rounded-lg p-5 group">
                <summary className="text-sm font-semibold text-[var(--usj-text)] cursor-pointer list-none flex justify-between items-center gap-4">
                  {t(`faq.${key}Question`)}
                  <span className="text-slate-400 group-open:rotate-45 transition-transform text-lg leading-none" aria-hidden="true">
                    +
                  </span>
                </summary>
                <p className="text-sm text-slate-600 mt-3 leading-relaxed">{t(`faq.${key}Answer`)}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* 11.5 Customer service / contact */}
      <section className="bg-white border-t border-slate-200">
        <div className="mx-auto max-w-4xl px-4 py-16 md:py-20">
          <div className="text-center mb-10">
            <h2 className="text-2xl md:text-3xl font-bold text-primary mb-4">
              {t("contact.title")}
            </h2>
            <p className="text-slate-600 leading-relaxed max-w-2xl mx-auto">
              {t("contact.description")}
            </p>
          </div>
          <div className="grid md:grid-cols-2 gap-6">
            <Card className="border-[#06C755]/30 bg-[#06C755]/5">
              <CardContent className="p-6 flex flex-col items-center text-center gap-3">
                <MessageCircle className="h-8 w-8 text-[#06C755]" aria-hidden="true" />
                <p className="text-sm font-semibold text-[var(--usj-text)]">
                  {t("contact.lineNote")}
                </p>
                <Button
                  asChild
                  size="lg"
                  className="h-auto px-6 py-3 bg-[#06C755] hover:bg-[#05b64c] text-white"
                >
                  <a href="https://lin.ee/Yu1BDaz" target="_blank" rel="noopener noreferrer">
                    {t("contact.lineButton")}
                  </a>
                </Button>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6 flex flex-col justify-center gap-3 text-sm text-slate-600">
                <p className="font-semibold text-[var(--usj-text)]">{t("contact.companyName")}</p>
                <p>{t("contact.companyAddress")}</p>
                <p>{t("contact.companyAddress2")}</p>
                <p>{t("contact.companyAddress3")}</p>
                <a
                  href="tel:+13103255000"
                  className="flex items-center gap-2 hover:text-primary transition-colors"
                >
                  <Phone className="h-4 w-4 shrink-0" aria-hidden="true" />
                  {t("contact.phoneLabel")}
                </a>
                <a
                  href="mailto:info@usajusho.com"
                  className="flex items-center gap-2 hover:text-primary transition-colors"
                >
                  <Mail className="h-4 w-4 shrink-0" aria-hidden="true" />
                  {t("contact.emailLabel")}
                </a>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* 12. Signup CTA */}
      <section className="bg-primary">
        <div className="mx-auto max-w-4xl px-4 py-16 md:py-20 text-center">
          <h2 className="text-2xl md:text-3xl font-bold text-white mb-4">{t("cta.title")}</h2>
          <p className="text-slate-300 mb-8 max-w-xl mx-auto leading-relaxed">{t("cta.description")}</p>
          <Button
            asChild
            size="lg"
            variant="secondary"
            className="h-auto px-8 py-3.5 text-sm font-semibold bg-white text-primary hover:bg-slate-100"
          >
            <Link href="/signup">{t("cta.button")}</Link>
          </Button>
        </div>
      </section>

      {/* 13. Homepage-specific account links (distinct from the shared site footer rendered in the layout) */}
      <section className="bg-white border-t border-slate-200">
        <div className="mx-auto max-w-6xl px-4 py-10 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div>
            <p className="font-bold text-primary mb-2">{tc("appName")}</p>
            <p className="text-xs text-slate-500 max-w-sm leading-relaxed">{t("footer.tagline")}</p>
          </div>
          <div className="flex flex-col gap-2 text-xs text-slate-500">
            <p className="font-semibold text-slate-700 mb-1">{t("footer.linksTitle")}</p>
            <div className="flex gap-4">
              <Link href="/login" className="hover:text-primary">
                {t("login")}
              </Link>
              <Link href="/signup" className="hover:text-primary">
                {t("signup")}
              </Link>
            </div>
          </div>
        </div>
      </section>
    </main>
  )
}
