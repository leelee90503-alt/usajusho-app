import { useTranslations } from "next-intl"
import { Link } from "@/i18n/navigation"

export default function Home() {
  const t = useTranslations("home")

  return (
    <main className="min-h-screen flex flex-col items-center justify-center bg-[var(--usj-surface)] px-4 text-center">
      <h1 className="text-3xl font-bold text-[var(--usj-primary)] mb-2">
        {t("title")}
      </h1>
      <p className="text-slate-500 mb-8 max-w-md">{t("description")}</p>
      <div className="flex gap-3">
        <Link
          href="/signup"
          className="bg-[var(--usj-primary)] text-white text-sm font-semibold rounded-md px-5 py-2.5 hover:opacity-90"
        >
          {t("signup")}
        </Link>
        <Link
          href="/login"
          className="bg-white text-[var(--usj-primary)] text-sm font-semibold rounded-md px-5 py-2.5 border border-slate-300 hover:bg-slate-100"
        >
          {t("login")}
        </Link>
      </div>
    </main>
  )
}
