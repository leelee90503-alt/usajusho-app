"use client"

import { useState, useTransition } from "react"
import { useTranslations } from "next-intl"
import { adminUpdateUserEmail, adminResetUserPassword } from "./actions"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent } from "@/components/ui/card"

type User = {
  id: string
  full_name: string | null
  suite_number: string | null
  is_admin: boolean
  email: string
}

function generateRandomPassword() {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789"
  let out = ""
  for (let i = 0; i < 12; i++) {
    out += chars[Math.floor(Math.random() * chars.length)]
  }
  return out
}

export default function UserRow({ user }: { user: User }) {
  const t = useTranslations("adminUsers")
  const [mode, setMode] = useState<"none" | "email" | "password">("none")
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)

  const [newEmail, setNewEmail] = useState(user.email)
  const [newPassword, setNewPassword] = useState("")

  function closeForm() {
    setMode("none")
    setError(null)
  }

  function openEmailForm() {
    setNewEmail(user.email)
    setNotice(null)
    setError(null)
    setMode((m) => (m === "email" ? "none" : "email"))
  }

  function openPasswordForm() {
    setNewPassword(generateRandomPassword())
    setNotice(null)
    setError(null)
    setMode((m) => (m === "password" ? "none" : "password"))
  }

  function handleSaveEmail(formData: FormData) {
    setError(null)
    setNotice(null)
    const email = String(formData.get("email") || "")
    startTransition(async () => {
      const result = await adminUpdateUserEmail(user.id, email)
      if (result?.error) {
        setError(result.error)
      } else {
        setNotice(t("emailUpdated"))
        setMode("none")
      }
    })
  }

  function handleSavePassword(formData: FormData) {
    setError(null)
    setNotice(null)
    const password = String(formData.get("password") || "")
    startTransition(async () => {
      const result = await adminResetUserPassword(user.id, password)
      if (result?.error) {
        setError(result.error)
      } else {
        setNotice(t("newPasswordDisplay", { password }))
        setMode("none")
      }
    })
  }

  return (
    <Card>
      <CardContent className="py-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <p className="text-sm font-semibold text-foreground">
                {user.full_name || user.email}
              </p>
              {user.is_admin && <Badge variant="secondary">{t("adminBadge")}</Badge>}
            </div>
            <p className="mt-1 text-xs text-muted-foreground">{user.email}</p>
            {user.suite_number && (
              <p className="mt-0.5 text-xs text-muted-foreground">
                {t("suiteLabel", { suite: user.suite_number })}
              </p>
            )}
          </div>

          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={openEmailForm}>
              {t("changeEmail")}
            </Button>
            <Button variant="outline" size="sm" onClick={openPasswordForm}>
              {t("resetPasswordButton")}
            </Button>
          </div>
        </div>

        {notice && (
          <p className="mt-3 break-all rounded-md bg-teal-50 px-3 py-2 text-sm text-teal-800">
            {notice}
          </p>
        )}

        {mode === "email" && (
          <form
            action={handleSaveEmail}
            className="mt-3 flex flex-wrap items-end gap-2 border-t pt-3"
          >
            <div className="min-w-[200px] flex-1 space-y-1">
              <Label className="text-xs font-normal">{t("newEmailLabel")}</Label>
              <Input
                type="email"
                name="email"
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
                required
              />
            </div>
            <Button type="submit" size="sm" disabled={isPending}>
              {t("saveEmail")}
            </Button>
            <Button type="button" variant="outline" size="sm" onClick={closeForm}>
              {t("cancel")}
            </Button>
          </form>
        )}

        {mode === "password" && (
          <form
            action={handleSavePassword}
            className="mt-3 flex flex-wrap items-end gap-2 border-t pt-3"
          >
            <div className="min-w-[240px] flex-1 space-y-1">
              <Label className="text-xs font-normal">{t("newPasswordLabel")}</Label>
              <div className="flex gap-2">
                <Input
                  type="text"
                  name="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                  minLength={6}
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setNewPassword(generateRandomPassword())}
                >
                  {t("generatePassword")}
                </Button>
              </div>
            </div>
            <Button type="submit" size="sm" disabled={isPending}>
              {t("savePassword")}
            </Button>
            <Button type="button" variant="outline" size="sm" onClick={closeForm}>
              {t("cancel")}
            </Button>
          </form>
        )}

        {error && (
          <p className="mt-3 rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
            {error}
          </p>
        )}
      </CardContent>
    </Card>
  )
}
