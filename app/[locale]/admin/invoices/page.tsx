
import { redirect, Link } from "@/i18n/navigation"
import { createClient } from "@/lib/supabase/server"
import { getLocale, getTranslations } from "next-intl/server"

type ProfileJoin = { full_name: string | null; suite_number: string | null } | { full_name: string | null; suite_number: string | null }[] | null

function oneProfile(p: ProfileJoin) {
  if (!p) return null
  return Array.isArray(p) ? (p[0] ?? null) : p
}

const STATUS_LABEL_KEY: Record<string, string> = {
  draft: "statusDraft",
  customer_submitted: "statusSubmitted",
  correction_required: "statusCorrectionRequired",
  admin_review: "statusAdminReview",
  complete: "statusComplete",
}

export default async function AdminInvoicesPage() {
  const locale = await getLocale()
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect({ href: "/login", locale })
    return
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("is_admin")
    .eq("id", user.id)
    .single()

  if (!profile?.is_admin) {
    redirect({ href: "/dashboard", locale })
    return
  }

  const t = await getTranslations("adminInvoices")

  const { data: allPackages } = await supabase
    .from("packages")
    .select("id, item_name, tracking_number, status, created_at, profiles(full_name, suite_number)")
    .order("created_at", { ascending: false })

  const { data: allInvoices } = await supabase
    .from("invoices")
    .select("id, package_id, status, invoice_number, total_declared_value")

  const invoiceByPackageId = new Map((allInvoices ?? []).map((inv) => [inv.package_id, inv]))

  const packages = allPackages ?? []
  const rows = packages.map((pkg) => ({
    pkg: { ...pkg, profiles: oneProfile(pkg.profiles as ProfileJoin) },
    invoice: invoiceByPackageId.get(pkg.id) ?? null,
  }))

  const statCounts = {
    total: rows.length,
    notStarted: rows.filter((r) => !r.invoice).length,
    draft: rows.filter((r) => r.invoice?.status === "draft").length,
    submitted: rows.filter((r) => r.invoice?.status === "customer_submitted").length,
    correction: rows.filter((r) => r.invoice?.status === "correction_required").length,
    complete: rows.filter((r) => r.invoice?.status === "complete").length,
  }

  return (
    <main className="mx-auto max-w-6xl px-4 py-10">
      <h1 className="text-2xl font-bold text-slate-900">{t("title")}</h1>
      <p className="mt-1 text-sm text-slate-500">{t("subtitle")}</p>

      <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        <StatCard label={t("statTotal")} value={statCounts.total} />
        <StatCard label={t("statNotStarted")} value={statCounts.notStarted} />
        <StatCard label={t("statDraft")} value={statCounts.draft} />
        <StatCard label={t("statSubmitted")} value={statCounts.submitted} />
        <StatCard label={t("statCorrection")} value={statCounts.correction} />
        <StatCard label={t("statComplete")} value={statCounts.complete} />
      </div>

      <div className="mt-8 overflow-x-auto rounded-xl border border-slate-200 bg-white">
        <table className="w-full min-w-[720px] text-sm">
          <thead>
            <tr className="border-b border-slate-100 text-left text-xs text-slate-500">
              <th className="px-4 py-3">{t("colCustomer")}</th>
              <th className="px-4 py-3">{t("colPackage")}</th>
              <th className="px-4 py-3">{t("colTracking")}</th>
              <th className="px-4 py-3">{t("colInvoiceStatus")}</th>
              <th className="px-4 py-3">{t("colDeclaredValue")}</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody>
            {rows.map(({ pkg, invoice }) => (
              <tr key={pkg.id} className="border-b border-slate-50 last:border-0">
                <td className="px-4 py-3">
                  <p className="font-medium text-slate-800">{pkg.profiles?.full_name ?? "—"}</p>
                  <p className="text-xs text-slate-400">{pkg.profiles?.suite_number ?? ""}</p>
                </td>
                <td className="px-4 py-3 text-slate-700">{pkg.item_name}</td>
                <td className="px-4 py-3 text-slate-500">{pkg.tracking_number ?? "—"}</td>
                <td className="px-4 py-3">
                  {invoice ? (
                    <span className="whitespace-nowrap rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
                      {t(STATUS_LABEL_KEY[invoice.status] ?? "statusDraft")}
                    </span>
                  ) : (
                    <span className="whitespace-nowrap rounded-full bg-slate-50 px-3 py-1 text-xs font-semibold text-slate-400">
                      {t("statusNotStarted")}
                    </span>
                  )}
                </td>
                <td className="px-4 py-3 text-slate-700">
                  {invoice ? `$${Number(invoice.total_declared_value).toLocaleString()}` : "—"}
                </td>
                <td className="px-4 py-3 text-right">
                  <Link
                    href={`/admin/invoices/${pkg.id}`}
                    className="text-xs font-semibold text-teal-700 hover:underline"
                  >
                    {invoice ? t("viewLink") : t("createLink")}
                  </Link>
                </td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-sm text-slate-400">
                  {t("noPackages")}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </main>
  )
}

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-3">
      <p className="text-xs text-slate-500">{label}</p>
      <p className="mt-1 text-xl font-bold text-slate-900">{value}</p>
    </div>
  )
}
