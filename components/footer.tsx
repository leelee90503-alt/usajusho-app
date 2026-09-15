import { getTranslations } from "next-intl/server"
import { Link } from "@/i18n/navigation"
import { Separator } from "@/components/ui/separator"

export default async function Footer() {
  const t = await getTranslations("footer")

  return (
    <footer className="mt-auto print:hidden">
      <Separator />
      <div className="mx-auto flex max-w-6xl flex-col items-center gap-3 px-4 py-8 text-sm text-muted-foreground sm:flex-row sm:justify-between">
        <p>{t("copyright")}</p>
        <nav className="flex items-center gap-4">
          <Link href="/legal/terms" className="transition-colors hover:text-primary">
            {t("terms")}
          </Link>
          <Link href="/legal/privacy" className="transition-colors hover:text-primary">
            {t("privacy")}
          </Link>
          <a
            href="https://lin.ee/Yu1BDaz"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 transition-colors hover:text-primary"
          >
            <span className="rounded bg-[#06C755] px-1.5 py-0.5 text-[10px] font-bold leading-none text-white">
              LINE
            </span>
            {t("line")}
          </a>
        </nav>
      </div>
    </footer>
  )
}
