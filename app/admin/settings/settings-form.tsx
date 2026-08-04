"use client"

import { useState, useTransition } from "react"
import { saveEmailSettings } from "./actions"

type Settings = {
  emailjs_service_id: string | null
  emailjs_template_id: string | null
  emailjs_public_key: string | null
  emailjs_private_key: string | null
} | null

export default function SettingsForm({ initialSettings }: { initialSettings: Settings }) {
  const [isPending, startTransition] = useTransition()
  const [message, setMessage] = useState<string | null>(null)
  const [configured, setConfigured] = useState(
    !!initialSettings?.emailjs_service_id &&
      !!initialSettings?.emailjs_template_id &&
      !!initialSettings?.emailjs_public_key
  )

  function handleSubmit(formData: FormData) {
    setMessage(null)
    startTransition(async () => {
      const result = await saveEmailSettings(formData)
      if (result?.error) {
        setMessage(result.error)
      } else {
        setMessage("保存しました。")
        setConfigured(
          !!String(formData.get("emailjs_service_id") || "").trim() &&
            !!String(formData.get("emailjs_template_id") || "").trim() &&
            !!String(formData.get("emailjs_public_key") || "").trim()
        )
      }
    })
  }

  return (
    <form action={handleSubmit} className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 space-y-4">
      <div className="flex items-center gap-2 mb-2">
        <span
          className={
            "inline-block h-2 w-2 rounded-full " + (configured ? "bg-emerald-500" : "bg-slate-300")
          }
        />
        <span className="text-sm text-slate-600">
          {configured ? "メール送信は有効です" : "未設定（アプリ内通知のみ）"}
        </span>
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">Service ID</label>
        <input
          type="text"
          name="emailjs_service_id"
          defaultValue={initialSettings?.emailjs_service_id ?? ""}
          className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">Template ID</label>
        <input
          type="text"
          name="emailjs_template_id"
          defaultValue={initialSettings?.emailjs_template_id ?? ""}
          className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">Public Key</label>
        <input
          type="text"
          name="emailjs_public_key"
          defaultValue={initialSettings?.emailjs_public_key ?? ""}
          className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">Private Key</label>
        <input
          type="password"
          name="emailjs_private_key"
          defaultValue={initialSettings?.emailjs_private_key ?? ""}
          className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
        />
        <p className="text-xs text-slate-400 mt-1">
          Private Key は EmailJS の Account → Security ページで確認できます。
        </p>
      </div>

      {message && <p className="text-sm text-teal-700">{message}</p>}

      <button
        type="submit"
        disabled={isPending}
        className="w-full bg-slate-900 text-white text-sm font-semibold rounded-md py-2.5 hover:bg-slate-800 disabled:opacity-50"
      >
        {isPending ? "保存中..." : "保存する"}
      </button>
    </form>
  )
}
