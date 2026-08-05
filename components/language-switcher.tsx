"use client"

import { useLocale, useTranslations } from "next-intl"
import { usePathname, useRouter } from "@/i18n/navigation"
import { useTransition } from "react"
import { Globe } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

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
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          disabled={isPending}
          aria-label={t("language")}
          className="gap-1.5 text-sm font-medium text-slate-600 hover:text-primary hover:bg-primary/5"
        >
          <Globe className="size-4" aria-hidden="true" />
          {locale === "ja" ? t("japanese") : t("english")}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem
          onClick={() => switchTo("ja")}
          disabled={isPending}
          aria-current={locale === "ja"}
          className={locale === "ja" ? "font-semibold text-primary" : undefined}
        >
          {t("japanese")}
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => switchTo("en")}
          disabled={isPending}
          aria-current={locale === "en"}
          className={locale === "en" ? "font-semibold text-primary" : undefined}
        >
          {t("english")}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
