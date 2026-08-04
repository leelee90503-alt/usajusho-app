import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import AddPackageForm from "./add-package-form"
import PackageRow from "./package-row"

export default async function AdminPackagesPage() {
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

  const { data: packages } = await supabase
    .from("packages")
    .select("*, profiles(full_name, suite_number)")
    .order("created_at", { ascending: false })

  return (
    <main className="min-h-screen bg-slate-50">
      <div className="mx-auto max-w-4xl px-6 py-10">
        <h1 className="text-xl font-bold text-slate-900">
          管理者: 荷物到着登録
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          ユーザーのスイート番号を入力して、到着した荷物を登録してください。
        </p>

        <div className="mt-6">
          <AddPackageForm />
        </div>

        <div className="mt-10">
          <h2 className="text-lg font-semibold text-slate-900">
            全ての荷物 ({packages?.length ?? 0})
          </h2>

          <div className="mt-3 space-y-3">
            {(packages ?? []).map((pkg: any) => (
              <PackageRow key={pkg.id} pkg={pkg} />
            ))}

            {(!packages || packages.length === 0) && (
              <div className="rounded-xl border border-dashed border-slate-300 bg-white p-8 text-center text-sm text-slate-500">
                登録された荷物はまだありません。
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  )
}
