import Link from 'next/link'

export default function Home() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center bg-slate-50 px-4 text-center">
      <h1 className="text-3xl font-bold text-slate-900 mb-2">USAJUSHO</h1>
      <p className="text-slate-500 mb-8 max-w-md">
        米国から日本への転送サービス。専用の米国住所で、米国のオンラインショップを日本からご利用いただけます。
      </p>
      <div className="flex gap-3">
        <Link
          href="/signup"
          className="bg-slate-900 text-white text-sm font-semibold rounded-md px-5 py-2.5 hover:bg-slate-800"
        >
          会員登録
        </Link>
        <Link
          href="/login"
          className="bg-white text-slate-900 text-sm font-semibold rounded-md px-5 py-2.5 border border-slate-300 hover:bg-slate-100"
        >
          ログイン
        </Link>
      </div>
    </main>
  )
}
