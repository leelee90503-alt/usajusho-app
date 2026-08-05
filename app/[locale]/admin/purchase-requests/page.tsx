import { redirect, Link } from "@/i18n/navigation"
import { createClient } from "@/lib/supabase/server"
import { getLocale, getTranslations } from "next-intl/server"
import RequestRow from "./request-row"
import FeeSettingsForm from "./fee-settings-form"
import { getPurchaseAgencyFeeSettings } from "@/lib/purchase-agency-settings"

export default async function AdminPurchaseRequestsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>
}) {
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

  const t = await getTranslations("adminPurchaseRequests")

  const { status = "" } = await searchParams

  const { data: allRequests } = await supabase
    .from("purchase_requests")
    .select("*, profiles(full_name, suite_number)")
    .order("created_at", { ascending: false })

  const requests = allRequests ?? []
  const feeSettings = await getPurchaseAgencyFeeSettings()
  const filtered = status
    ? requests.filter((r) => r.status === status)
    : requests

  const STATUS_FILTERS = [
    { value: "", label: t("filterAll") },
    { value: "submitted", label: t("filterSubmitted") },
    { value: "quote_sent", label: t("filterQuoteSent") },
    { value: "awaiting_payment", label: t("filterAwaitingPayment") },
    { value: "paid", label: t("filterPaid") },
    { value: "purchasing", label: t("filterPurchasing") },
    { value: "purchased", label: t("filterPurchased") },
    { value: "cancelled", label: t("filterCancelled") },
    { value: "refunded", label: t("filterRefunded") },
  ]

  return (
    <main className="min-h-screen bg-slate-50">
      <div className="mx-auto max-w-4xl px-6 py-10">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-bold text-slate-900">{t("title")}</h1>
          <Link
            href="/admin/packages"
            className="text-sm text-teal-700 hover:underline"
          >
            {t("packagesLink")}
          </Link>
        </div>
        <p className="mt-1 text-sm text-slate-500">{t("description")}</p>

        <FeeSettingsForm initialSettings={feeSettings} />

        <form className="mt-6 flex flex-wrap items-center gap-2" method="get">
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
            {t("filterButton")}
          </button>
        </form>

        <div className="mt-6 space-y-3">
          {filtered.map((request) => (
            <RequestRow key={request.id} request={request} feeSettings={feeSettings} />
          ))}

          {filtered.length === 0 && (
            <div className="rounded-xl border border-dashed border-slate-300 bg-white p-8 text-center text-sm text-slate-500">
              {requests.length === 0 ? t("emptyNone") : t("emptyFiltered")}
            </div>
          )}
        </div>
      </div>
    </main>
  )
}
