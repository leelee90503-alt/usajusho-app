"use client"

import { useState, useTransition } from "react"
import { useLocale, useTranslations } from "next-intl"
import { useRouter } from "@/i18n/navigation"
import { replyToPurchaseRequest } from "../actions"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Loader2 } from "lucide-react"

type Message = {
  id: string
  sender_role: string
  body: string
  created_at: string
}

export default function MessageThread({
  requestId,
  messages,
}: {
  requestId: string
  messages: Message[]
}) {
  const t = useTranslations("purchaseRequests")
  const locale = useLocale()
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [text, setText] = useState("")
  const [status, setStatus] = useState<string | null>(null)

  function handleSend() {
    if (!text.trim()) {
      setStatus(t("messageReplyEmpty"))
      return
    }
    setStatus(null)
    startTransition(async () => {
      const result = await replyToPurchaseRequest(requestId, text)
      if (result?.error) {
        setStatus(result.error)
      } else {
        setText("")
        setStatus(t("messageReplySuccess"))
        router.refresh()
      }
    })
  }

  return (
    <div className="space-y-3">
      {messages.length === 0 ? (
        <p className="text-sm text-muted-foreground">{t("messagesEmpty")}</p>
      ) : (
        <div className="space-y-2">
          {messages.map((m) => (
            <div
              key={m.id}
              className={`rounded-lg px-3 py-2 text-sm ${
                m.sender_role === "admin"
                  ? "bg-slate-100 text-slate-800"
                  : "bg-teal-50 text-teal-900"
              }`}
            >
              <p className="text-xs text-muted-foreground">
                {m.sender_role === "admin" ? t("messageFromAdmin") : t("messageFromYou")} ·{" "}
                {new Date(m.created_at).toLocaleString(locale)}
              </p>
              <p className="mt-1 whitespace-pre-wrap">{m.body}</p>
            </div>
          ))}
        </div>
      )}
      <Textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder={t("messageReplyPlaceholder")}
        rows={3}
        maxLength={2000}
      />
      <div className="flex items-center gap-3">
        <Button type="button" size="sm" onClick={handleSend} disabled={isPending}>
          {isPending && <Loader2 className="h-4 w-4 animate-spin" />}
          {t("messageReplySubmit")}
        </Button>
        {status && <p className="text-xs text-muted-foreground">{status}</p>}
      </div>
    </div>
  )
}
