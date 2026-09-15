import { getTranslations } from "next-intl/server"

export default async function LineFloatingButton() {
  const t = await getTranslations("lineChat")

  return (
    <a
      href="https://lin.ee/Yu1BDaz"
      target="_blank"
      rel="noopener noreferrer"
      aria-label={t("ariaLabel")}
      className="fixed bottom-5 right-5 z-50 flex items-center gap-2 rounded-full bg-[#06C755] py-3 pl-3 pr-4 text-sm font-bold text-white shadow-lg transition-transform hover:scale-105 hover:bg-[#05b64c] print:hidden"
    >
      <svg
        viewBox="0 0 24 24"
        aria-hidden="true"
        className="h-6 w-6 shrink-0"
        fill="currentColor"
      >
        <path d="M12 2C6.48 2 2 5.66 2 10.2c0 4.03 3.44 7.4 8.09 8.06.32.07.75.21.86.49.1.25.06.65.03.9l-.14.87c-.04.25-.2 1 .87.55 1.07-.46 5.77-3.4 7.87-5.83C21.4 13.4 22 11.86 22 10.2 22 5.66 17.52 2 12 2z" />
      </svg>
      {t("label")}
    </a>
  )
}
