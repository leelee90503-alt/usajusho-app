import { getTranslations, getLocale } from 'next-intl/server'
import { redirect, Link } from '@/i18n/navigation'
import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ArrowLeft, UserRound } from 'lucide-react'
import ProfileForm from './profile-form'

export default async function ProfilePage() {
  const supabase = await createClient()
  const locale = await getLocale()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect({ href: '/login', locale })
    return
  }

  const t = await getTranslations('profileForm')

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  return (
    <main className="min-h-screen bg-[var(--usj-surface)]">
      <div className="mx-auto max-w-xl px-6 py-10">
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-1 text-sm text-accent hover:underline"
        >
          <ArrowLeft className="h-4 w-4" />
          {t('backLink')}
        </Link>

        <Card className="mt-4">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg font-bold text-primary">
              <UserRound className="h-5 w-5" />
              {t('title')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ProfileForm
              profile={{
                full_name: profile?.full_name ?? null,
                email: user.email ?? '',
                phone_number: profile?.phone_number ?? null,
                japan_postal_code: profile?.japan_postal_code ?? null,
                japan_prefecture: profile?.japan_prefecture ?? null,
                japan_city: profile?.japan_city ?? null,
                japan_address_line1: profile?.japan_address_line1 ?? null,
                japan_address_line2: profile?.japan_address_line2 ?? null,
              }}
            />
          </CardContent>
        </Card>
      </div>
    </main>
  )
}
