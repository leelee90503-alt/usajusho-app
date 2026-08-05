"use client"

import { useState, useTransition } from "react"
import { useTranslations } from "next-intl"
import {
  addWhitelistDomain,
  deleteWhitelistDomain,
  toggleWhitelistDomain,
} from "./actions"

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
    <div className="mt-6 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
      <h2 className="text-sm font-semibold text-slate-900">{t("whitelistHeading")}</h2>
      <p className="mt-1 text-sm text-slate-500">{t("whitelistDescription")}</p>

      <div className="mt-4 space-y-2">
        {domains.map((d) => (
          <div
            key={d.id}
            className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-slate-200 px-3 py-2"
          >
            <div>
              <p className="text-sm font-medium text-slate-900">{d.label}</p>
              <p className="text-xs text-slate-500">{d.domain}</p>
            </div>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => handleToggle(d.id, !d.enabled)}
                disabled={isPending}
                className={
                  d.enabled
                    ? "rounded-lg bg-teal-50 px-3 py-1 text-xs font-semibold text-teal-700 disabled:opacity-50"
                    : "rounded-lg bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-500 disabled:opacity-50"
                }
              >
                {d.enabled ? t("whitelistEnabled") : t("whitelistDisabled")}
              </button>
              <button
                type="button"
                onClick={() => handleDelete(d.id, d.label, d.domain)}
                disabled={isPending}
                className="text-xs font-semibold text-red-600 hover:underline disabled:opacity-50"
              >
                {t("whitelistRemove")}
              </button>
            </div>
          </div>
        ))}

        {domains.length === 0 && (
          <p className="rounded-lg border border-dashed border-slate-300 px-3 py-4 text-center text-sm text-slate-500">
            {t("whitelistEmpty")}
          </p>
        )}
      </div>

      <form
        action={handleAdd}
        className="mt-4 flex flex-wrap items-end gap-4 border-t border-slate-100 pt-4"
      >
        <div>
          <label className="block text-xs font-medium text-slate-600">
            {t("whitelistLabelField")}
          </label>
          <input
            type="text"
            name="label"
            required
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            placeholder="Amazon"
            className="mt-1 w-40 rounded-lg border border-slate-300 px-3 py-2 text-sm"
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-slate-600">
            {t("whitelistDomainField")}
          </label>
          <input
            type="text"
            name="domain"
            required
            value={domain}
            onChange={(e) => setDomain(e.target.value)}
            placeholder="amazon.com"
            className="mt-1 w-48 rounded-lg border border-slate-300 px-3 py-2 text-sm"
          />
        </div>

        <button
          type="submit"
          disabled={isPending}
          className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800 disabled:opacity-50"
        >
          {isPending ? t("whitelistAdding") : t("whitelistAddButton")}
        </button>
      </form>

      {message && (
        <p
          className={
            message.type === "error" ? "mt-3 text-sm text-red-600" : "mt-3 text-sm text-teal-700"
          }
        >
          {message.text}
        </p>
      )}
    </div>
  )
}
