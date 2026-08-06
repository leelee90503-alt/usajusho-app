import { redirect, Link } from '@/i18n/navigation'
import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { getLocale, getTranslations } from 'next-intl/server'
import UserRow from "./user-row"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

export default async function AdminUsersPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>
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
  }

  const t = await getTranslations('adminUsers')

  const { q = "" } = await searchParams

  const { data: profiles } = await supabase
    .from("profiles")
    .select("id, full_name, suite_number, is_admin, email")
    .order("created_at", { ascending: false })

  // profiles.email isn't guaranteed to be populated for every account (it
  // depends on which version of the signup trigger ran at the time), so the
  // Auth Admin API is the source of truth for each user's actual login
  // email - fall back to the profiles column only if a user is somehow
  // missing from that list.
  const adminSupabase = createAdminClient()
  const emailById = new Map<string, string>()
  const { data: userList } = await adminSupabase.auth.admin.listUsers({ perPage: 1000 })
  for (const u of userList?.users ?? []) {
    if (u.email) emailById.set(u.id, u.email)
  }

  const users = (profiles ?? []).map((p) => ({
    ...p,
    email: emailById.get(p.id) ?? p.email ?? "",
  }))

  const query = q.trim().toLowerCase()
  const filteredUsers = users.filter((u) => {
    if (!query) return true
    return (
      u.full_name?.toLowerCase().includes(query) ||
      u.suite_number?.toLowerCase().includes(query) ||
      u.email?.toLowerCase().includes(query)
    )
  })

  return (
    <main className="min-h-screen bg-[var(--usj-surface)]">
      <div className="mx-auto max-w-4xl px-6 py-10">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h1 className="text-xl font-bold text-primary">{t("title")}</h1>
          <nav className="flex items-center gap-1">
            <Button asChild variant="ghost" size="sm">
              <Link href="/admin/packages">{t("packagesLink")}</Link>
            </Button>
          </nav>
        </div>
        <p className="mt-1 text-sm text-muted-foreground">{t("description")}</p>

        <form className="mt-6 flex flex-wrap items-center gap-2" method="get">
          <Input
            type="text"
            name="q"
            defaultValue={q}
            placeholder={t("searchPlaceholder")}
            className="w-64"
          />
          <Button type="submit" size="sm">
            {t("searchButton")}
          </Button>
          {q && (
            <Button asChild variant="link" size="sm" className="text-muted-foreground">
              <Link href="/admin/users">{t("clear")}</Link>
            </Button>
          )}
        </form>

        <div className="mt-6">
          <h2 className="text-lg font-semibold text-foreground">
            {t("allUsers", { count: filteredUsers.length })}
          </h2>

          <div className="mt-3 space-y-3">
            {filteredUsers.map((u) => (
              <UserRow key={u.id} user={u} />
            ))}

            {filteredUsers.length === 0 && (
              <Card className="border-dashed">
                <CardContent className="py-8 text-center text-sm text-muted-foreground">
                  {users.length === 0 ? t("emptyNone") : t("emptyFiltered")}
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </main>
  )
}
