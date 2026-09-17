import { getTranslations } from "next-intl/server"
import { Link } from "@/i18n/navigation"
import { Button } from "@/components/ui/button"
import LanguageSwitcher from "@/components/language-switcher"
import MobileNav from "@/components/mobile-nav"

export default async function Header() {
  const t = await getTranslations("nav")
  const tc = await getTranslations("common")

  const mobileLinks = [
    { href: "/how-it-works", label: t("howItWorks") },
    { href: "/customs", label: t("customs") },
    { href: "/purchase-agency", label: t("purchaseAgency") },
  ]

  return (
    <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/80 print:hidden">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
        <Link
          href="/"
          className="text-lg font-bold tracking-tight text-primary"
        >
          {tc("appName")}
        </Link>

        {/* Desktop nav */}
        <nav className="hidden md:flex items-center gap-1" aria-label={t("purchaseAgency")}>
          <Button
            asChild
            variant="ghost"
            size="sm"
            className="text-sm font-medium text-slate-600 hover:text-primary hover:bg-primary/5"
          >
            <Link href="/how-it-works">{t("howItWorks")}</Link>
          </Button>
          <Button
            asChild
            variant="ghost"
            size="sm"
            className="text-sm font-medium text-slate-600 hover:text-primary hover:bg-primary/5"
          >
            <Link href="/customs">{t("customs")}</Link>
          </Button>
          <Button
            asChild
            variant="ghost"
            size="sm"
            className="text-sm font-medium text-slate-600 hover:text-primary hover:bg-primary/5"
          >
            <Link href="/purchase-agency">{t("purchaseAgency")}</Link>
          </Button>
          <Button
            asChild
            variant="ghost"
            size="sm"
            className="text-sm font-medium text-slate-600 hover:text-primary hover:bg-primary/5"
          >
            <Link href="/login">{t("login")}</Link>
          </Button>
          <Button
            asChild
            variant="default"
            size="sm"
            className="text-sm font-medium"
          >
            <Link href="/signup">{t("signup")}</Link>
          </Button>
          <LanguageSwitcher />
        </nav>

        {/* Mobile nav */}
        <div className="flex items-center gap-1 md:hidden">
          <LanguageSwitcher />
          <MobileNav
            links={mobileLinks}
            loginLabel={t("login")}
            signupLabel={t("signup")}
            menuLabel={t("menuLabel")}
          />
        </div>
      </div>
    </header>
  )
}
