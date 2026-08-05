import { notFound } from "next/navigation"
import LegalDocument from "@/components/legal-document"
import { privacyEn } from "@/content/legal/privacy.en"
import { privacyJa } from "@/content/legal/privacy.ja"
import type { LegalDoc } from "@/content/legal/types"

const docsByLocale: Record<string, LegalDoc> = {
  en: privacyEn,
  ja: privacyJa,
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
