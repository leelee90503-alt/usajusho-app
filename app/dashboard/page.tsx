import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import SignOutButton from './sign-out-button'

const STATUS_LABELS: Record<string, string> = {
  arrived: '到着済み',
  requested: '発送依頼済み',
  shipped: '発送完了',
}

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

  const { data: packages } = await supabase
    .from('packages')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  return (
    <main className="min-h-screen bg-slate-50">
      <div className="mx-auto max-w-3xl px-6 py-10">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-bold text-slate-900">USAJUSHO</h1>
          <SignOutButton />
        </div>

        <div className="mt-8">
          <h2 className="text-2xl font-bold text-slate-900">
            ようこそ、{profile?.full_name || user.email}さん
          </h2>
          <p className="mt-1 text-sm text-slate-500">{user.email}</p>
        </div>

        {profile && (
          <div className="mt-6 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-wide text-teal-700">
              あなたの米国住所 / Your US Address
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
              この住所を米国のオンラインショップでの配送先として使用してください。
            </p>
          </div>
        )}

        <div className="mt-8">
          <h3 className="text-lg font-semibold text-slate-900">
            届いた荷物 / My Packages
          </h3>

          {(!packages || packages.length === 0) && (
            <div className="mt-3 rounded-xl border border-dashed border-slate-300 bg-white p-8 text-center text-sm text-slate-500">
              まだ届いた荷物はありません。
              <br />
              上記の米国住所宛に商品を発送すると、ここに表示されます。
            </div>
          )}

          {packages && packages.length > 0 && (
            <ul className="mt-3 space-y-3">
              {packages.map((pkg) => (
                <li
                  key={pkg.id}
                  className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="font-semibold text-slate-900">{pkg.item_name}</p>
                      {pkg.tracking_number && (
                        <p className="mt-1 text-xs text-slate-500">
                          追跡番号: {pkg.tracking_number}
                        </p>
                      )}
                      {pkg.weight_lbs && (
                        <p className="mt-1 text-xs text-slate-500">
                          重量: {pkg.weight_lbs} lbs
                        </p>
                      )}
                      {pkg.admin_note && (
                        <p className="mt-2 text-xs text-slate-600">{pkg.admin_note}</p>
                      )}
                    </div>
                    <span className="whitespace-nowrap rounded-full bg-teal-50 px-3 py-1 text-xs font-semibold text-teal-700">
                      {STATUS_LABELS[pkg.status] || pkg.status}
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </main>
  )
}
