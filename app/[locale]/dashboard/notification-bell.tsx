'use client'

import { useState, useTransition } from "react"
import { useTranslations, useLocale } from "next-intl"
import { markNotificationRead, markAllNotificationsRead } from "./actions"
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

export default function NotificationBell({ notifications }: { notifications: Notification[] }) {
  const t = useTranslations("notificationBell")
  const locale = useLocale()
  const [open, setOpen] = useState(false)
  const [isPending, startTransition] = useTransition()

  const unreadCount = notifications.filter((n) => !n.is_read).length

  function handleMarkRead(id: string) {
    startTransition(() => {
      markNotificationRead(id)
    })
  }

  function handleMarkAllRead() {
    startTransition(() => {
      markAllNotificationsRead()
    })
  }

  return (
    <div className="relative">
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={() => setOpen((v) => !v)}
        className="relative"
      >
        <Bell className="h-4 w-4" />
        {t("title")}
        {unreadCount > 0 && (
          <Badge className="absolute -right-2 -top-2 h-5 w-5 justify-center rounded-full bg-red-500 p-0 text-white">
            {unreadCount}
          </Badge>
        )}
      </Button>

      {open && (
        <div className="absolute right-0 z-10 mt-2 w-80 rounded-xl border border-slate-200 bg-white shadow-lg">
          <div className="flex items-center justify-between border-b border-slate-100 p-3">
            <p className="text-sm font-semibold text-slate-900">{t("title")}</p>
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
          </div>

          <div className="max-h-96 overflow-y-auto">
            {notifications.length === 0 && (
              <p className="p-4 text-center text-sm text-muted-foreground">{t("empty")}</p>
            )}
            {notifications.map((n) => {
              // Falls back to Japanese when no English translation was
              // stored for this notification (older rows, or a call site
              // not yet translated) - see NotificationPanel for the same
              // pattern on the admin side.
              const title = locale === "en" && n.title_en ? n.title_en : n.title
              const body = locale === "en" && n.body_en ? n.body_en : n.body
              return (
                <div
                  key={n.id}
                  className={`border-b border-slate-50 p-3 text-sm last:border-b-0 ${
                    n.is_read ? "bg-white" : "bg-primary/5"
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
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
                  <p className="mt-1 text-xs text-slate-600">{body}</p>
                  <p className="mt-1 text-xs text-muted-foreground">{formatDate(n.created_at)}</p>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
