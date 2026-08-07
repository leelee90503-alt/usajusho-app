'use client'

import { useTransition } from "react"
import { useTranslations, useLocale } from "next-intl"
import { markAdminNotificationRead, markAllAdminNotificationsRead } from "./notifications-actions"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Bell } from "lucide-react"

type Notification = {
  id: string
  title: string
  body: string
  title_en?: string | null
  body_en?: string | null
  is_read: boolean
  created_at: string
}

function formatDate(iso: string) {
  const d = new Date(iso)
  return `${d.getMonth() + 1}/${d.getDate()} ${d.getHours()}:${String(d.getMinutes()).padStart(2, "0")}`
}

// Unlike the customer-facing NotificationBell (a dropdown), this renders the
// admin's recent notifications inline as a full list so unread items are
// visible at a glance on the admin home dashboard, without an extra click.
export default function NotificationPanel({ notifications }: { notifications: Notification[] }) {
  const t = useTranslations("notificationBell")
  const locale = useLocale()
  const [isPending, startTransition] = useTransition()

  const unreadCount = notifications.filter((n) => !n.is_read).length

  function handleMarkRead(id: string) {
    startTransition(() => {
      markAdminNotificationRead(id)
    })
  }

  function handleMarkAllRead() {
    startTransition(() => {
      markAllAdminNotificationsRead()
    })
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0">
        <CardTitle className="flex items-center gap-2 text-base">
          <Bell className="h-4 w-4" />
          {t("title")}
          {unreadCount > 0 && (
            <Badge className="rounded-full bg-red-500 px-2 py-0 text-white">{unreadCount}</Badge>
          )}
        </CardTitle>
        {unreadCount > 0 && (
          <Button
            type="button"
            variant="link"
            size="sm"
            onClick={handleMarkAllRead}
            disabled={isPending}
            className="h-auto p-0 text-xs"
          >
            {t("markAllRead")}
          </Button>
        )}
      </CardHeader>
      <CardContent>
        {notifications.length === 0 && (
          <p className="py-6 text-center text-sm text-muted-foreground">{t("empty")}</p>
        )}
        <div className="max-h-96 divide-y divide-slate-100 overflow-y-auto">
          {notifications.map((n) => {
            // Notifications carry both a Japanese title/body and (for
            // admin-facing ones created after the bilingual migration) an
            // English title_en/body_en. Older rows and customer-originated
            // ones have no English variant yet, so fall back to Japanese
            // rather than showing a blank line.
            const title = locale === "en" && n.title_en ? n.title_en : n.title
            const body = locale === "en" && n.body_en ? n.body_en : n.body
            return (
              <div
                key={n.id}
                className={`py-3 text-sm first:pt-0 last:pb-0 ${n.is_read ? "" : "bg-primary/5"}`}
              >
                <div className="flex items-start justify-between gap-2 px-1">
                  <p className="font-semibold text-slate-900">{title}</p>
                  {!n.is_read && (
                    <Button
                      type="button"
                      variant="link"
                      size="sm"
                      onClick={() => handleMarkRead(n.id)}
                      disabled={isPending}
                      className="h-auto whitespace-nowrap p-0 text-xs text-slate-400 hover:text-primary"
                    >
                      {t("markRead")}
                    </Button>
                  )}
                </div>
                <p className="mt-1 px-1 text-xs text-slate-600">{body}</p>
                <p className="mt-1 px-1 text-xs text-muted-foreground">{formatDate(n.created_at)}</p>
              </div>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}
