import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { notFound } from "next/navigation"
import CustomsGuide from "@/components/customs/customs-guide"
import { customsEn } from "@/content/customs/en"
import { customsJa } from "@/content/customs/ja"
import type { CustomsDoc } from "@/content/customs/types"

const docsByLocale: Record<string, CustomsDoc> = {
  en: customsEn,
  ja: customsJa,
}


export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "seo.customs" });
  return {
    title: t("title"),
    description: t("description"),
  };
}

export default async function CustomsPage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  const doc = docsByLocale[locale]

  if (!doc) {
    notFound()
  }

  return <CustomsGuide doc={doc} />
}
