"use client"

import { useState, useTransition } from "react"
import { markNotificationRead, markAllNotificationsRead } from "./actions"

type Notification = {
  id: string
  title: string
  body: string
  is_read: boolean
  created_at: string
}

function formatDate(iso: string) {
  const d = new Date(iso)
  return `${d.getMonth() + 1}/${d.getDate()} ${d.getHours()}:${String(d.getMinutes()).padStart(2, "0")}`
}

export default function NotificationBell({ notifications }: { notifications: Notification[] }) {
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
      <button
        onClick={() => setOpen((v) => !v)}
        className="relative rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm text-slate-700 hover:bg-slate-50"
      >
        通知
        {unreadCount > 0 && (
          <span className="absolute -right-1.5 -top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-xs font-semibold text-white">
            {unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 z-10 mt-2 w-80 rounded-xl border border-slate-200 bg-white shadow-lg">
          <div className="flex items-center justify-between border-b border-slate-100 p-3">
            <p className="text-sm font-semibold text-slate-900">通知</p>
            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllRead}
                disabled={isPending}
                className="text-xs text-teal-700 hover:underline disabled:opacity-50"
              >
                すべて既読にする
              </button>
            )}
          </div>

          <div className="max-h-96 overflow-y-auto">
            {notifications.length === 0 && (
              <p className="p-4 text-center text-sm text-slate-400">通知はありません。</p>
            )}
            {notifications.map((n) => (
              <div
                key={n.id}
                className={`border-b border-slate-50 p-3 text-sm last:border-b-0 ${
                  n.is_read ? "bg-white" : "bg-teal-50"
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <p className="font-semibold text-slate-900">{n.title}</p>
                  {!n.is_read && (
                    <button
                      onClick={() => handleMarkRead(n.id)}
                      disabled={isPending}
                      className="whitespace-nowrap text-xs text-slate-400 hover:text-teal-700 disabled:opacity-50"
                    >
                      既読
                    </button>
                  )}
                </div>
                <p className="mt-1 text-xs text-slate-600">{n.body}</p>
                <p className="mt-1 text-xs text-slate-400">{formatDate(n.created_at)}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
