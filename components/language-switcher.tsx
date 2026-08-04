"use client"

import { useLocale, useTranslations } from "next-intl"
import { usePathname, useRouter } from "@/i18n/navigation"
import { useTransition } from "react"

export default function LanguageSwitcher() {
  const t = useTranslations("common")
  const locale = useLocale()
  const router = useRouter()
  const pathname = usePathname()
  const [isPending, startTransition] = useTransition()

  function switchTo(nextLocale: "ja" | "en") {
    startTransition(() => {
      router.replace(pathname, { locale: nextLocale })
    })
  }

  return (
    <div className="flex items-center gap-1 text-sm" aria-label={t("language")}>
      <button
        type="button"
        onClick={() => switchTo("ja")}
        disabled={isPending}
        aria-current={locale === "ja"}
        className={`rounded px-2 py-1 font-medium transition-colors ${
          locale === "ja"
            ? "bg-[#1B2A4A] text-white"
            : "text-slate-500 hover:text-[#1B2A4A]"
        }`}
      >
        日本語
      </button>
      <span className="text-slate-300">/</span>
      <button
        type="button"
        onClick={() => switchTo("en")}
        disabled={isPending}
        aria-current={locale === "en"}
        className={`rounded px-2 py-1 font-medium transition-colors ${
          locale === "en"
            ? "bg-[#1B2A4A] text-white"
            : "text-slate-500 hover:text-[#1B2A4A]"
        }`}
      >
        EN
      </button>
    </div>
  )
}
