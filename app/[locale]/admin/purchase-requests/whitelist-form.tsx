"use client"

import { useState, useTransition } from "react"
import { useTranslations } from "next-intl"
import {
  addWhitelistDomain,
  deleteWhitelistDomain,
  toggleWhitelistDomain,
} from "./actions"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Trash2, Loader2 } from "lucide-react"

type WhitelistDomain = {
  id: string
  domain: string
  label: string
  enabled: boolean
}

// Normalizes a raw domain/URL typed by an admin into a bare lowercase
// hostname (no protocol, no "www.", no path/query), e.g. turns
// "https://www.Amazon.com/some/path?x=1" into "amazon.com". Duplicated
// (rather than shared) with the server-side normalization in
// ./actions.ts so this file has no server-only imports.
function normalizeDomain(input: string): string {
  return input
    .trim()
    .toLowerCase()
    .replace(/^https?:\/\//, "")
    .replace(/^www\./, "")
    .split("/")[0]
    .split("?")[0]
}

export default function WhitelistForm({
  initialDomains,
}: {
  initialDomains: WhitelistDomain[]
}) {
  const t = useTranslations("adminPurchaseRequests")
  const [domains, setDomains] = useState(initialDomains)
  const [label, setLabel] = useState("")
  const [domain, setDomain] = useState("")
  const [isPending, startTransition] = useTransition()
  const [message, setMessage] = useState<
    { type: "error" | "success"; text: string } | null
  >(null)

  function handleAdd(formData: FormData) {
    setMessage(null)
    const normalizedDomain = normalizeDomain(String(formData.get("domain") || ""))
    formData.set("domain", normalizedDomain)

    startTransition(async () => {
      const result = await addWhitelistDomain(formData)
      if (result?.error) {
        setMessage({ type: "error", text: result.error })
        return
      }
      if (result?.domain) {
        setDomains((prev) =>
          [...prev, result.domain!].sort((a, b) => a.label.localeCompare(b.label)),
        )
      }
      setLabel("")
      setDomain("")
      setMessage({ type: "success", text: t("whitelistAddSuccess") })
    })
  }

  function handleToggle(id: string, enabled: boolean) {
    setMessage(null)
    setDomains((prev) => prev.map((d) => (d.id === id ? { ...d, enabled } : d)))
    startTransition(async () => {
      const result = await toggleWhitelistDomain(id, enabled)
      if (result?.error) {
        setMessage({ type: "error", text: result.error })
        setDomains((prev) =>
          prev.map((d) => (d.id === id ? { ...d, enabled: !enabled } : d)),
        )
      }
    })
  }

  function handleDelete(id: string, label: string, domainName: string) {
    if (!window.confirm(t("whitelistRemoveConfirm", { label, domain: domainName }))) {
      return
    }
    setMessage(null)
    const previous = domains
    setDomains((prev) => prev.filter((d) => d.id !== id))
    startTransition(async () => {
      const result = await deleteWhitelistDomain(id)
      if (result?.error) {
        setMessage({ type: "error", text: result.error })
        setDomains(previous)
      }
    })
  }

  return (
    <Card className="mt-6">
      <CardHeader>
        <CardTitle>{t("whitelistHeading")}</CardTitle>
        <CardDescription>{t("whitelistDescription")}</CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        {domains.length > 0 ? (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t("whitelistLabelField")}</TableHead>
                <TableHead>{t("whitelistDomainField")}</TableHead>
                <TableHead>{t("whitelistEnabled")}</TableHead>
                <TableHead className="text-right">{t("whitelistRemove")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {domains.map((d) => (
                <TableRow key={d.id}>
                  <TableCell className="font-medium text-foreground">{d.label}</TableCell>
                  <TableCell className="text-muted-foreground">{d.domain}</TableCell>
                  <TableCell>
                    <Switch
                      checked={d.enabled}
                      onCheckedChange={(checked) => handleToggle(d.id, checked)}
                      disabled={isPending}
                      aria-label={d.enabled ? t("whitelistEnabled") : t("whitelistDisabled")}
                    />
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon-sm"
                      onClick={() => handleDelete(d.id, d.label, d.domain)}
                      disabled={isPending}
                      aria-label={t("whitelistRemove")}
                    >
                      <Trash2 className="text-destructive" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ) : (
          <p className="rounded-lg border border-dashed border-border px-3 py-4 text-center text-sm text-muted-foreground">
            {t("whitelistEmpty")}
          </p>
        )}

        <form
          action={handleAdd}
          className="flex flex-wrap items-end gap-4 border-t border-border pt-4"
        >
          <div className="space-y-1.5">
            <Label htmlFor="whitelist-label">{t("whitelistLabelField")}</Label>
            <Input
              id="whitelist-label"
              type="text"
              name="label"
              required
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              placeholder="Amazon"
              className="w-40"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="whitelist-domain">{t("whitelistDomainField")}</Label>
            <Input
              id="whitelist-domain"
              type="text"
              name="domain"
              required
              value={domain}
              onChange={(e) => setDomain(e.target.value)}
              placeholder="amazon.com"
              className="w-48"
            />
          </div>

          <Button type="submit" disabled={isPending}>
            {isPending && <Loader2 className="h-4 w-4 animate-spin" />}
            {isPending ? t("whitelistAdding") : t("whitelistAddButton")}
          </Button>
        </form>

        {message && (
          <p
            className={
              message.type === "error" ? "text-sm text-destructive" : "text-sm text-accent"
            }
          >
            {message.text}
          </p>
        )}
      </CardContent>
    </Card>
  )
}
