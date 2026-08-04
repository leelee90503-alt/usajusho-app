import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import SignOutButton from './sign-out-button'

export default async function DashboardPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  return (
    <main className="min-h-screen bg-slate-50">
      <header className="bg-white border-b border-slate-200">
        <div className="max-w-4xl mx-auto px-6 py-4 flex items-center justify-between">
          <span className="font-bold text-slate-900">USAJUSHO</span>
          <SignOutButton />
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-6 py-10">
        <h1 className="text-2xl font-bold text-slate-900 mb-1">
          ようこそ{profile?.full_name ? `、${profile.full_name}さん` : ''}
        </h1>
        <p className="text-slate-500 mb-8">{user.email}</p>

        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <h2 className="text-sm font-semibold text-teal-700 uppercase tracking-wide mb-4">
            あなたの米国住所 / Your US Address
          </h2>

          {profile ? (
            <div className="space-y-1 font-mono text-sm text-slate-800">
              <p>{profile.full_name || user.email}</p>
              <p>{profile.us_address_line1}</p>
              <p className="font-semibold text-slate-900">{profile.us_address_line2}</p>
              <p>
                {profile.us_city}, {profile.us_state} {profile.us_zip}
              </p>
              <p>United States</p>
            </div>
          ) : (
            <p className="text-sm text-slate-500">住所を読み込み中...</p>
          )}

          <p className="text-xs text-slate-400 mt-4">
            この住所を米国のオンラインショップでの配送先として使用してください。
          </p>
        </div>
      </div>
    </main>
  )
}
