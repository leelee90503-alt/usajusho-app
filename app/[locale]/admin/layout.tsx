import { Link } from '@/i18n/navigation'
import { getTranslations } from 'next-intl/server'
import type { ReactNode } from 'react'

export default async function AdminLayout({ children }: { children: ReactNode }) {
  const t = await getTranslations('adminLayout')

  return (
    <div>
      <div className="border-b border-border bg-white">
        <div className="mx-auto max-w-4xl px-6 py-2">
          <Link
            href="/admin"
            className="inline-flex items-center gap-1 text-sm font-medium text-muted-foreground transition-colors hover:text-primary"
          >
            ← {t("homeLink")}
          </Link>
        </div>
      </div>
      {children}
    </div>
  )
}
