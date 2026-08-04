import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import SettingsForm from "./settings-form"

export default async function AdminSettingsPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/login")
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("is_admin")
    .eq("id", user.id)
    .single()

  if (!profile?.is_admin) {
    redirect("/dashboard")
  }

  const { data: settings } = await supabase
    .from("email_settings")
    .select("emailjs_service_id, emailjs_template_id, emailjs_public_key, emailjs_private_key")
    .eq("id", 1)
    .maybeSingle()

  return (
    <main className="min-h-screen bg-slate-50">
      <div className="mx-auto max-w-2xl px-6 py-10">
        <div className="flex items-center justify-between mb-1">
          <h1 className="text-xl font-bold text-slate-900">メール通知設定</h1>
          <a href="/admin/packages" className="text-sm text-teal-700 hover:underline">
            荷物管理に戻る
          </a>
        </div>
        <p className="text-sm text-slate-500 mb-6">
          EmailJS のアカウント情報を入力すると、荷物の到着・見積り・発送完了時にユーザーへ自動でメールが送信されます。
          未設定の間はアプリ内通知のみが送られます。
        </p>

        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 mb-6">
          <h2 className="text-sm font-semibold text-slate-900 mb-3">設定手順</h2>
          <ol className="text-sm text-slate-600 space-y-2 list-decimal list-inside">
            <li>emailjs.com でアカウントを作成し、Email Service を追加してください。</li>
            <li>
              Email Template を作成し、本文に <code className="bg-slate-100 px-1 rounded">to_email</code>,{" "}
              <code className="bg-slate-100 px-1 rounded">to_name</code>,{" "}
              <code className="bg-slate-100 px-1 rounded">subject</code>,{" "}
              <code className="bg-slate-100 px-1 rounded">message</code> の変数を使ってください。
            </li>
            <li>
              EmailJS の Account → Security で「API calls are disabled for non-browser applications」を
              無効にしてください（サーバーから送信するため必須です）。
            </li>
            <li>Service ID・Template ID・Public Key・Private Key を下のフォームに入力して保存してください。</li>
          </ol>
        </div>

        <SettingsForm initialSettings={settings ?? null} />
      </div>
    </main>
  )
}
