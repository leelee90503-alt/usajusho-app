import { useTranslations } from "next-intl"
import { getTranslations } from "next-intl/server"
import { Link } from "@/i18n/navigation"
import { createClient } from "@/lib/supabase/server"
import FeeCalculator from "@/components/home/fee-calculator"
import DeliveryJourney from "@/components/home/delivery-journey"
import LanguageSwitcher from "@/components/language-switcher"
import type { ShippingRate } from "@/lib/pricing"

export default async function Home() {
  const t = await getTranslations("home")

  const supabase = await createClient()
  const { data: rates } = await supabase
    .from("shipping_rates")
    .select("id, label, min_weight_kg, max_weight_kg, price_per_kg, min_charge, is_active, sort_order")
    .eq("is_active", true)
    .order("sort_order", { ascending: true })

  const shippingRates = (rates ?? []) as ShippingRate[]

  return (
    <main className="flex flex-col">
      {/* 2. Hero */}
      <section className="bg-[var(--usj-surface)] border-b border-slate-200">
        <div className="mx-auto max-w-6xl px-4 py-16 md:py-24 grid md:grid-cols-2 gap-12 items-center">
          <div>
            <p className="text-[var(--usj-accent)] font-semibold text-sm mb-3 tracking-wide">
              {t("hero.eyebrow")}
            </p>
            <h1 className="text-3xl md:text-5xl font-bold text-[var(--usj-primary)] leading-tight mb-5">
              {t("hero.headline")}
            </h1>
            <p className="text-slate-600 text-base md:text-lg mb-8 max-w-md leading-relaxed">
              {t("hero.description")}
            </p>
            <div className="flex flex-wrap gap-3 mb-8">
              <Link
                href="/signup"
                className="bg-[var(--usj-primary)] text-white text-sm font-semibold rounded-md px-6 py-3 hover:opacity-90 transition-opacity"
              >
                {t("hero.ctaPrimary")}
              </Link>
              <a
                href="#calculator"
                className="bg-white text-[var(--usj-primary)] text-sm font-semibold rounded-md px-6 py-3 border border-slate-300 hover:bg-slate-50 transition-colors"
              >
                {t("hero.ctaSecondary")}
              </a>
            </div>
            <p className="text-xs text-slate-500">{t("hero.trustNote")}</p>
          </div>

          {/* Realistic package-status preview panel, not an abstract graphic */}
          <div className="bg-white border border-slate-200 rounded-lg shadow-sm p-5">
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs font-semibold text-slate-400 tracking-wide">
                {t("hero.previewLabel")}
              </span>
              <span className="text-xs font-medium text-[var(--usj-accent)] bg-[var(--usj-accent)]/10 rounded px-2 py-1">
                {t("hero.previewStatus")}
              </span>
            </div>
            <div className="space-y-3">
              <div className="flex gap-3 items-center border-b border-slate-100 pb-3">
                <div className="w-12 h-12 rounded bg-slate-100 shrink-0" aria-hidden="true" />
                <div className="min-w-0">
                  <p className="text-sm font-medium text-[var(--usj-text)] truncate">
                    {t("hero.previewItem1")}
                  </p>
                  <p className="text-xs text-slate-500">{t("hero.previewMeta1")}</p>
                </div>
              </div>
              <div className="flex gap-3 items-center">
                <div className="w-12 h-12 rounded bg-slate-100 shrink-0" aria-hidden="true" />
                <div className="min-w-0">
                  <p className="text-sm font-medium text-[var(--usj-text)] truncate">
                    {t("hero.previewItem2")}
                  </p>
                  <p className="text-xs text-slate-500">{t("hero.previewMeta2")}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 3. Trust indicators */}
      <section className="border-b border-slate-200">
        <div className="mx-auto max-w-6xl px-4 py-10 grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
          <div>
            <p className="text-2xl font-bold text-[var(--usj-primary)]">{t("trust.stat1Value")}</p>
            <p className="text-xs text-slate-500 mt-1">{t("trust.stat1Label")}</p>
          </div>
          <div>
            <p className="text-2xl font-bold text-[var(--usj-primary)]">{t("trust.stat2Value")}</p>
            <p className="text-xs text-slate-500 mt-1">{t("trust.stat2Label")}</p>
          </div>
          <div>
            <p className="text-2xl font-bold text-[var(--usj-primary)]">{t("trust.stat3Value")}</p>
            <p className="text-xs text-slate-500 mt-1">{t("trust.stat3Label")}</p>
          </div>
          <div>
            <p className="text-2xl font-bold text-[var(--usj-primary)]">{t("trust.stat4Value")}</p>
            <p className="text-xs text-slate-500 mt-1">{t("trust.stat4Label")}</p>
          </div>
        </div>
      </section>

      {/* 4. Illustrated delivery process */}
      <section className="bg-white">
        <div className="mx-auto max-w-6xl px-4 py-16 md:py-20">
          <div className="max-w-2xl mb-12">
            <h2 className="text-2xl md:text-3xl font-bold text-[var(--usj-primary)] mb-3">
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
            ]}
          />
        </div>
      </section>

      {/* 5. US warehouse address explanation */}
      <section className="bg-[var(--usj-surface)] border-y border-slate-200">
        <div className="mx-auto max-w-6xl px-4 py-16 md:py-20 grid md:grid-cols-2 gap-10 items-center">
          <div>
            <h2 className="text-2xl md:text-3xl font-bold text-[var(--usj-primary)] mb-4">
              {t("address.title")}
            </h2>
            <p className="text-slate-600 leading-relaxed mb-6">{t("address.description")}</p>
            <ul className="space-y-3">
              <li className="flex gap-3 text-sm text-slate-700">
                <span className="text-[var(--usj-accent)] font-bold">01</span>
                {t("address.point1")}
              </li>
              <li className="flex gap-3 text-sm text-slate-700">
                <span className="text-[var(--usj-accent)] font-bold">02</span>
                {t("address.point2")}
              </li>
              <li className="flex gap-3 text-sm text-slate-700">
                <span className="text-[var(--usj-accent)] font-bold">03</span>
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
              src="/images/inspection-exterior.svg"
              alt={t("inspection.exteriorAlt")}
              className="aspect-square rounded-lg bg-[var(--usj-surface)] border border-slate-200 object-cover w-full"
            />
            <img
              src="/images/inspection-interior.svg"
              alt={t("inspection.interiorAlt")}
              className="aspect-square rounded-lg bg-[var(--usj-surface)] border border-slate-200 object-cover w-full mt-6"
            />
          </div>
          <div className="order-1 md:order-2">
            <h2 className="text-2xl md:text-3xl font-bold text-[var(--usj-primary)] mb-4">
              {t("inspection.title")}
            </h2>
            <p className="text-slate-600 leading-relaxed">{t("inspection.description")}</p>
          </div>
        </div>
      </section>

      {/* 7. Consolidation / repackaging guide */}
      <section className="bg-[var(--usj-surface)] border-y border-slate-200">
        <div className="mx-auto max-w-6xl px-4 py-16 md:py-20 grid md:grid-cols-2 gap-10 items-center">
          <div>
            <h2 className="text-2xl md:text-3xl font-bold text-[var(--usj-primary)] mb-4">
              {t("consolidation.title")}
            </h2>
            <p className="text-slate-600 leading-relaxed">{t("consolidation.description")}</p>
          </div>
          <div className="bg-white border border-slate-200 rounded-lg p-6">
            <div className="flex items-center gap-3 text-sm text-slate-500 mb-3">
              <div className="w-8 h-8 rounded bg-slate-100" aria-hidden="true" />
              <div className="w-8 h-8 rounded bg-slate-100" aria-hidden="true" />
              <div className="w-8 h-8 rounded bg-slate-100" aria-hidden="true" />
              <span aria-hidden="true">→</span>
              <div className="w-10 h-10 rounded bg-[var(--usj-accent)]/15 border border-[var(--usj-accent)]/30" aria-hidden="true" />
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
            <h2 className="text-2xl md:text-3xl font-bold text-[var(--usj-primary)] mb-3">
              {t("addons.title")}
            </h2>
            <p className="text-slate-600 leading-relaxed">{t("addons.description")}</p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {["item1", "item2", "item3", "item4", "item5", "item6"].map((key) => (
              <div key={key} className="border border-slate-200 rounded-lg p-5">
                <p className="text-sm font-semibold text-[var(--usj-text)] mb-1">
                  {t(`addons.${key}Title`)}
                </p>
                <p className="text-xs text-slate-500 leading-relaxed">{t(`addons.${key}Description`)}</p>
              </div>
            ))}
          </div>
          <p className="text-xs text-slate-500 mt-6">{t("addons.footnote")}</p>
        </div>
      </section>

      {/* 9. Shipping fee calculator */}
      <section id="calculator" className="bg-[var(--usj-surface)] border-y border-slate-200 scroll-mt-16">
        <div className="mx-auto max-w-6xl px-4 py-16 md:py-20 grid md:grid-cols-2 gap-10 items-start">
          <div>
            <h2 className="text-2xl md:text-3xl font-bold text-[var(--usj-primary)] mb-4">
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
              }}
          />
        </div>
      </section>

      {/* 10. Tracking / delivery completion guide */}
      <section className="bg-white">
        <div className="mx-auto max-w-6xl px-4 py-16 md:py-20 grid md:grid-cols-2 gap-10 items-center">
          <div>
            <h2 className="text-2xl md:text-3xl font-bold text-[var(--usj-primary)] mb-4">
              {t("tracking.title")}
            </h2>
            <p className="text-slate-600 leading-relaxed">{t("tracking.description")}</p>
          </div>
          <div className="bg-[var(--usj-surface)] border border-slate-200 rounded-lg p-6">
            <div className="flex items-center gap-2 mb-4">
              {[0, 1, 2, 3].map((i) => (
                <div key={i} className="flex items-center flex-1 last:flex-none">
                  <div
                    className={`w-3 h-3 rounded-full ${i <= 2 ? "bg-[var(--usj-accent)]" : "bg-slate-300"}`}
                    aria-hidden="true"
                  />
                  {i < 3 && (
                    <div className={`h-0.5 flex-1 ${i < 2 ? "bg-[var(--usj-accent)]" : "bg-slate-300"}`} aria-hidden="true" />
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
      <section className="bg-[var(--usj-surface)] border-y border-slate-200">
        <div className="mx-auto max-w-3xl px-4 py-16 md:py-20">
          <h2 className="text-2xl md:text-3xl font-bold text-[var(--usj-primary)] mb-10 text-center">
            {t("faq.title")}
          </h2>
          <div className="space-y-4">
            {["q1", "q2", "q3", "q4"].map((key) => (
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

      {/* 12. Signup CTA */}
      <section className="bg-[var(--usj-primary)]">
        <div className="mx-auto max-w-4xl px-4 py-16 md:py-20 text-center">
          <h2 className="text-2xl md:text-3xl font-bold text-white mb-4">{t("cta.title")}</h2>
          <p className="text-slate-300 mb-8 max-w-xl mx-auto leading-relaxed">{t("cta.description")}</p>
          <Link
            href="/signup"
            className="inline-block bg-white text-[var(--usj-primary)] text-sm font-semibold rounded-md px-8 py-3.5 hover:bg-slate-100 transition-colors"
          >
            {t("cta.button")}
          </Link>
        </div>
      </section>

      {/* 13. Footer */}
      <FooterSection />
    </main>
  )
}

function FooterSection() {
  const t = useTranslations("home")
  const tc = useTranslations("common")

  return (
    <footer className="bg-white border-t border-slate-200">
      <div className="mx-auto max-w-6xl px-4 py-10 flex flex-col md:flex-row justify-between gap-6">
        <div>
          <p className="font-bold text-[var(--usj-primary)] mb-2">{tc("appName")}</p>
          <p className="text-xs text-slate-500 max-w-sm leading-relaxed">{t("footer.tagline")}</p>
        </div>
        <div className="flex flex-col gap-2 text-xs text-slate-500">
          <p className="font-semibold text-slate-700 mb-1">{t("footer.linksTitle")}</p>
          <Link href="/login" className="hover:text-[var(--usj-primary)]">
            {t("login")}
          </Link>
          <Link href="/signup" className="hover:text-[var(--usj-primary)]">
            {t("signup")}
          </Link>
        </div>
        <div className="text-xs" aria-label={tc("language")}>
          <LanguageSwitcher />
        </div>
      </div>
      <div className="border-t border-slate-200">
        <div className="mx-auto max-w-6xl px-4 py-4 text-xs text-slate-400">
          {t("footer.copyright")}
        </div>
      </div>
    </footer>
  )
}
