import { Link } from "@/i18n/navigation"
import { getTranslations } from "next-intl/server"

export default async function PurchaseAgencyPage() {
  const t = await getTranslations("purchaseAgency")

  const steps = [
    { title: t("step1Title"), description: t("step1Description") },
    { title: t("step2Title"), description: t("step2Description") },
    { title: t("step3Title"), description: t("step3Description") },
    { title: t("step4Title"), description: t("step4Description") },
    { title: t("step5Title"), description: t("step5Description") },
    { title: t("step6Title"), description: t("step6Description") },
  ]

  const benefits = [
    { title: t("benefit1Title"), description: t("benefit1Description") },
    { title: t("benefit2Title"), description: t("benefit2Description") },
    { title: t("benefit3Title"), description: t("benefit3Description") },
    { title: t("benefit4Title"), description: t("benefit4Description") },
  ]

  return (
    <main className="flex flex-col">
      <section className="bg-[var(--usj-surface)] border-b border-slate-200">
        <div className="mx-auto max-w-4xl px-4 py-16 md:py-24 text-center">
          <p className="text-[var(--usj-accent)] font-semibold text-sm mb-3 tracking-wide">
            {t("eyebrow")}
          </p>
          <h1 className="text-3xl md:text-5xl font-bold text-[var(--usj-primary)] leading-tight mb-5">
            {t("headline")}
          </h1>
          <p className="text-slate-600 text-base md:text-lg mb-8 max-w-2xl mx-auto leading-relaxed">
            {t("description")}
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            <Link
              href="/dashboard/purchase-requests"
              className="bg-[var(--usj-primary)] text-white text-sm font-semibold rounded-md px-6 py-3 hover:opacity-90 transition-opacity"
            >
              {t("ctaPrimary")}
            </Link>
            <Link
              href="/signup"
              className="bg-white text-[var(--usj-primary)] text-sm font-semibold rounded-md px-6 py-3 border border-slate-300 hover:bg-slate-50 transition-colors"
            >
              {t("ctaSecondary")}
            </Link>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-5xl px-4 py-16 md:py-20 w-full">
        <div className="text-center mb-10">
          <h2 className="text-2xl md:text-3xl font-bold text-[var(--usj-primary)]">
            {t("stepsTitle")}
          </h2>
          <p className="text-slate-600 mt-2">{t("stepsDescription")}</p>
        </div>
        <ol className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {steps.map((step, index) => (
            <li
              key={step.title}
              className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm"
            >
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[var(--usj-primary)] text-sm font-bold text-white">
                {index + 1}
              </div>
              <h3 className="mt-3 font-semibold text-slate-900">
                {step.title}
              </h3>
              <p className="mt-1 text-sm text-slate-600 leading-relaxed">
                {step.description}
              </p>
            </li>
          ))}
        </ol>
      </section>

      <section className="bg-[var(--usj-surface)] border-y border-slate-200">
        <div className="mx-auto max-w-5xl px-4 py-16 md:py-20">
          <div className="text-center mb-10">
            <h2 className="text-2xl md:text-3xl font-bold text-[var(--usj-primary)]">
              {t("benefitsTitle")}
            </h2>
            <p className="text-slate-600 mt-2">{t("benefitsDescription")}</p>
          </div>
          <div className="grid gap-5 sm:grid-cols-2">
            {benefits.map((benefit) => (
              <div
                key={benefit.title}
                className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm"
              >
                <h3 className="font-semibold text-slate-900">
                  {benefit.title}
                </h3>
                <p className="mt-1 text-sm text-slate-600 leading-relaxed">
                  {benefit.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-3xl px-4 py-16 md:py-20 text-center w-full">
        <h2 className="text-2xl md:text-3xl font-bold text-[var(--usj-primary)] mb-4">
          {t("finalCtaTitle")}
        </h2>
        <p className="text-slate-600 mb-8">{t("finalCtaDescription")}</p>
        <Link
          href="/dashboard/purchase-requests"
          className="inline-block bg-[var(--usj-primary)] text-white text-sm font-semibold rounded-md px-6 py-3 hover:opacity-90 transition-opacity"
        >
          {t("ctaPrimary")}
        </Link>
      </section>
    </main>
  )
}
