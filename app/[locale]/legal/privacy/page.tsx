import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { notFound } from "next/navigation"
import LegalDocument from "@/components/legal-document"
import { privacyEn } from "@/content/legal/privacy.en"
import { privacyJa } from "@/content/legal/privacy.ja"
import type { LegalDoc } from "@/content/legal/types"

const docsByLocale: Record<string, LegalDoc> = {
  en: privacyEn,
  ja: privacyJa,
}


export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "seo.legalPrivacy" });
  return {
    title: t("title"),
    description: t("description"),
  };
}

export default async function PrivacyPolicyPage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  const doc = docsByLocale[locale]

  if (!doc) {
    notFound()
  }

  return <LegalDocument doc={doc} />
}
