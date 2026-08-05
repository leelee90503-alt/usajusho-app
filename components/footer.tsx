import { getTranslations } from "next-intl/server"
import { Link } from "@/i18n/navigation"

export default async function Footer() {
  const t = await getTranslations("footer")

  return (
    <footer className="border-t border-slate-200">
      <div className="mx-auto max-w-6xl px-4 py-6 flex flex-wrap items-center justify-center gap-4 text-sm text-slate-500">
        <Link href="/legal/terms" className="hover:text-[var(--usj-primary)]">
          {t("terms")}
        </Link>
        <span aria-hidden="true">·</span>
        <Link href="/legal/privacy" className="hover:text-[var(--usj-primary)]">
          {t("privacy")}
        </Link>
      </div>
    </footer>
  )
}
