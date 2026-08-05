import { notFound } from "next/navigation"
import LegalDocument from "@/components/legal-document"
import { termsEn } from "@/content/legal/terms.en"
import { termsJa } from "@/content/legal/terms.ja"
import type { LegalDoc } from "@/content/legal/types"

const docsByLocale: Record<string, LegalDoc> = {
  en: termsEn,
  ja: termsJa,
}

export default async function TermsOfServicePage({
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
