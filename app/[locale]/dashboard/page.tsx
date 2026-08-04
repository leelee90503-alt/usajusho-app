import { getTranslations, getLocale } from 'next-intl/server'
import { redirect } from '@/i18n/navigation'
import { createClient } from '@/lib/supabase/server'
import SignOutButton from './sign-out-button'
import PackageList from './package-list'
import NotificationBell from './notification-bell'

export default async function DashboardPage() {
  const supabase = await createClient()
  const locale = await getLocale()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect({ href: '/login', locale })
    return
  }

  const t = await getTranslations('dashboard')

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  const { data: packages } = await supabase
    .from('packages')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  const { data: notifications } = await supabase
    .from('notifications')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(20)

  return (
    <main className="min-h-screen bg-[var(--usj-surface)]">
      <div className="mx-auto max-w-3xl px-6 py-10">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-bold text-[var(--usj-primary)]">USAJUSHO</h1>
          <div className="flex items-center gap-3">
            <NotificationBell notifications={notifications ?? []} />
            <SignOutButton />
          </div>
        </div>

        <div className="mt-8">
          <h2 className="text-2xl font-bold text-slate-900">
            {t("welcome", { name: profile?.full_name || user.email })}
          </h2>
          <p className="mt-1 text-sm text-slate-500">{user.email}</p>
        </div>

        {profile && (
          <div className="mt-8 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <p className="text-sm font-semibold text-teal-700">
              {t('myAddress')} / Your US Address
            </p>
            <div className="mt-3 space-y-0.5 text-sm text-slate-700">
              <p>{profile.full_name}</p>
              <p>{profile.us_address_line1}</p>
              <p className="font-semibold">{profile.us_address_line2}</p>
              <p>
                {profile.us_city}, {profile.us_state} {profile.us_zip}
              </p>
              <p>United States</p>
            </div>
            <p className="mt-4 text-xs text-slate-400">
              {t("addressNote")}
            </p>
          </div>
        )}

        <div className="mt-8">
          <h3 className="text-lg font-semibold text-slate-900">
            {t("myPackages")}
          </h3>
          <PackageList packages={packages ?? []} />
        </div>
      </div>
    </main>
  )
}
