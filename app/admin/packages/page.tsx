import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import AddPackageForm from "./add-package-form"
import PackageRow from "./package-row"

const STATUS_FILTERS = [
  { value: "", label: "すべて" },
  { value: "arrived", label: "到着済み" },
  { value: "requested", label: "発送依頼済み" },
  { value: "quoted", label: "見積済み" },
  { value: "paid", label: "支払い済み" },
  { value: "shipped", label: "発送完了" },
]

const STATUS_LABELS: Record<string, string> = {
  arrived: "到着済み",
  requested: "発送依頼済み",
  quoted: "見積済み",
  paid: "支払い済み",
  shipped: "発送完了",
}

export default async function AdminPackagesPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; status?: string }>
}) {
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

  const { q = "", status = "" } = await searchParams

  const { data: allPackages } = await supabase
    .from("packages")
    .select("*, profiles(full_name, suite_number)")
    .order("created_at", { ascending: false })

  const { count: userCount } = await supabase
    .from("profiles")
    .select("*", { count: "exact", head: true })

  const packages = allPackages ?? []

  const statCounts = {
    total: packages.length,
    arrived: packages.filter((p: any) => p.status === "arrived").length,
    requested: packages.filter((p: any) => p.status === "requested").length,
    quoted: packages.filter((p: any) => p.status === "quoted").length,
    paid: packages.filter((p: any) => p.status === "paid").length,
    shipped: packages.filter((p: any) => p.status === "shipped").length,
  }

  const query = q.trim().toLowerCase()
  const filteredPackages = packages.filter((pkg: any) => {
    const matchesStatus = !status || pkg.status === status
    const matchesQuery =
      !query ||
      pkg.item_name?.toLowerCase().includes(query) ||
      pkg.tracking_number?.toLowerCase().includes(query) ||
      pkg.profiles?.full_name?.toLowerCase().includes(query) ||
      pkg.profiles?.suite_number?.toLowerCase().includes(query)
    return matchesStatus && matchesQuery
  })

  return (
    <main className="min-h-screen bg-slate-50">
      <div className="mx-auto max-w-4xl px-6 py-10">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-bold text-slate-900">管理者: 荷物到着登録</h1>
          <a href="/admin/settings" className="text-sm text-teal-700 hover:underline">
            メール通知設定
          </a>
        </div>
        <p className="mt-1 text-sm text-slate-500">
          ユーザーのスイート番号を入力して、到着した荷物を登録してください。
        </p>

        <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-6">
          <div className="rounded-xl border border-slate-200 bg-white p-3 text-center shadow-sm">
            <p className="text-2xl font-bold text-slate-900">{statCounts.total}</p>
            <p className="mt-1 text-xs text-slate-500">全件</p>
          </div>
          <div className="rounded-xl border border-slate-200 bg-white p-3 text-center shadow-sm">
            <p className="text-2xl font-bold text-slate-900">{userCount ?? 0}</p>
            <p className="mt-1 text-xs text-slate-500">ユーザー数</p>
          </div>
          <div className="rounded-xl border border-slate-200 bg-white p-3 text-center shadow-sm">
            <p className="text-2xl font-bold text-teal-700">{statCounts.arrived}</p>
            <p className="mt-1 text-xs text-slate-500">到着済み</p>
          </div>
          <div className="rounded-xl border border-slate-200 bg-white p-3 text-center shadow-sm">
            <p className="text-2xl font-bold text-teal-700">{statCounts.requested}</p>
            <p className="mt-1 text-xs text-slate-500">発送依頼済み</p>
          </div>
          <div className="rounded-xl border border-slate-200 bg-white p-3 text-center shadow-sm">
            <p className="text-2xl font-bold text-amber-700">{statCounts.quoted}</p>
            <p className="mt-1 text-xs text-slate-500">見積済み</p>
          </div>
          <div className="rounded-xl border border-slate-200 bg-white p-3 text-center shadow-sm">
            <p className="text-2xl font-bold text-slate-700">{statCounts.shipped}</p>
            <p className="mt-1 text-xs text-slate-500">発送完了</p>
          </div>
        </div>

        <div className="mt-6">
          <AddPackageForm />
        </div>

        <div className="mt-10">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-lg font-semibold text-slate-900">
              全ての荷物 ({filteredPackages.length})
            </h2>

            <form className="flex flex-wrap items-center gap-2" method="get">
              <input
                type="text"
                name="q"
                defaultValue={q}
                placeholder="名前・スイート・追跡番号で検索"
                className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm"
              />
              <select
                name="status"
                defaultValue={status}
                className="rounded-lg border border-slate-300 px-2 py-1.5 text-sm"
              >
                {STATUS_FILTERS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
              <button
                type="submit"
                className="rounded-lg bg-slate-900 px-3 py-1.5 text-sm font-semibold text-white hover:bg-slate-800"
              >
                検索
              </button>
              {(q || status) && (
                <a
                  href="/admin/packages"
                  className="text-sm text-slate-500 underline hover:text-slate-700"
                >
                  クリア
                </a>
              )}
            </form>
          </div>

          <div className="mt-3 space-y-3">
            {filteredPackages.map((pkg: any) => (
              <PackageRow key={pkg.id} pkg={pkg} />
            ))}

            {filteredPackages.length === 0 && (
              <div className="rounded-xl border border-dashed border-slate-300 bg-white p-8 text-center text-sm text-slate-500">
                {packages.length === 0
                  ? "登録された荷物はまだありません。"
                  : "条件に一致する荷物がありません。"}
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  )
}
