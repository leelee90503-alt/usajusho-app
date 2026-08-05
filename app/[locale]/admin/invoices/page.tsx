import { redirect, Link } from "@/i18n/navigation"
import { createClient } from "@/lib/supabase/server"
import { getLocale, getTranslations } from "next-intl/server"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

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

const STATUS_BADGE_CLASS: Record<string, string> = {
  draft: "bg-slate-100 text-slate-700",
  customer_submitted: "bg-slate-100 text-slate-700",
  correction_required: "bg-amber-100 text-amber-800",
  admin_review: "bg-slate-100 text-slate-700",
  complete: "bg-teal-100 text-teal-800",
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
      <h1 className="text-2xl font-bold text-primary">{t("title")}</h1>
      <p className="mt-1 text-sm text-muted-foreground">{t("subtitle")}</p>

      <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        <StatCard label={t("statTotal")} value={statCounts.total} />
        <StatCard label={t("statNotStarted")} value={statCounts.notStarted} />
        <StatCard label={t("statDraft")} value={statCounts.draft} />
        <StatCard label={t("statSubmitted")} value={statCounts.submitted} />
        <StatCard label={t("statCorrection")} value={statCounts.correction} />
        <StatCard label={t("statComplete")} value={statCounts.complete} />
      </div>

      <Card className="mt-8">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t("colCustomer")}</TableHead>
              <TableHead>{t("colPackage")}</TableHead>
              <TableHead>{t("colTracking")}</TableHead>
              <TableHead>{t("colInvoiceStatus")}</TableHead>
              <TableHead>{t("colDeclaredValue")}</TableHead>
              <TableHead className="text-right" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map(({ pkg, invoice }) => (
              <TableRow key={pkg.id}>
                <TableCell>
                  <p className="font-medium text-foreground">{pkg.profiles?.full_name ?? "—"}</p>
                  <p className="text-xs text-muted-foreground">{pkg.profiles?.suite_number ?? ""}</p>
                </TableCell>
                <TableCell className="text-foreground">{pkg.item_name}</TableCell>
                <TableCell className="text-muted-foreground">{pkg.tracking_number ?? "—"}</TableCell>
                <TableCell>
                  {invoice ? (
                    <Badge className={STATUS_BADGE_CLASS[invoice.status] ?? "bg-slate-100 text-slate-700"}>
                      {t(STATUS_LABEL_KEY[invoice.status] ?? "statusDraft")}
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="text-muted-foreground">
                      {t("statusNotStarted")}
                    </Badge>
                  )}
                </TableCell>
                <TableCell className="text-foreground">
                  {invoice ? `$${Number(invoice.total_declared_value).toLocaleString()}` : "—"}
                </TableCell>
                <TableCell className="text-right">
                  <Link
                    href={`/admin/invoices/${pkg.id}`}
                    className="text-xs font-semibold text-accent hover:underline"
                  >
                    {invoice ? t("viewLink") : t("createLink")}
                  </Link>
                </TableCell>
              </TableRow>
            ))}
            {rows.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} className="py-8 text-center text-sm text-muted-foreground">
                  {t("noPackages")}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </Card>
    </main>
  )
}

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <Card>
      <CardContent className="py-3">
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="mt-1 text-xl font-bold text-foreground">{value}</p>
      </CardContent>
    </Card>
  )
}
