import type { Metadata } from "next";
import { getTranslations } from "next-intl/server"
import { Link } from "@/i18n/navigation"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  SignupArt,
  ShopArt,
  DeclareArt,
  WarehouseArt,
  ConsolidateArt,
  ShipArt,
  DeliveredArt,
} from "@/components/how-it-works/step-illustrations"


export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "seo.howItWorks" });
  return {
    title: t("title"),
    description: t("description"),
  };
}

export default async function HowItWorksPage() {
  const t = await getTranslations("howItWorks")

  const steps = [
    { Art: SignupArt, title: t("step1Title"), youDo: t("step1YouDo"), weHandle: t("step1WeHandle") },
    { Art: ShopArt, title: t("step2Title"), youDo: t("step2YouDo"), weHandle: t("step2WeHandle") },
    { Art: DeclareArt, title: t("step3Title"), youDo: t("step3YouDo"), weHandle: t("step3WeHandle") },
    { Art: WarehouseArt, title: t("step4Title"), youDo: t("step4YouDo"), weHandle: t("step4WeHandle") },
    { Art: ConsolidateArt, title: t("step5Title"), youDo: t("step5YouDo"), weHandle: t("step5WeHandle") },
    { Art: ShipArt, title: t("step6Title"), youDo: t("step6YouDo"), weHandle: t("step6WeHandle") },
    { Art: DeliveredArt, title: t("step7Title"), youDo: t("step7YouDo"), weHandle: t("step7WeHandle") },
  ]

  return (
    <div>
      <section className="bg-[var(--usj-surface)] border-b border-slate-200">
        <div className="mx-auto max-w-4xl px-4 py-16 text-center">
          <span className="inline-block rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-primary mb-4">
            {t("eyebrow")}
          </span>
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-[var(--usj-text)] mb-4">
            {t("title")}
          </h1>
          <p className="text-slate-600 max-w-2xl mx-auto leading-relaxed">{t("description")}</p>
        </div>
      </section>

      <section className="mx-auto max-w-5xl px-4 py-16">
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
                  <div className="w-full max-w-[280px] rounded-2xl bg-[var(--usj-surface)] p-4">
                    <Art className="w-full h-auto" />
                  </div>
                </div>
                <div className="w-full md:w-1/2">
                  <div className="flex items-center gap-3 mb-3">
                    <Badge className="h-7 w-7 shrink-0 justify-center rounded-full p-0 text-sm">{i + 1}</Badge>
                    <h2 className="text-xl font-semibold text-[var(--usj-text)]">{step.title}</h2>
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

      <section className="bg-[var(--usj-surface)] border-t border-slate-200">
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
