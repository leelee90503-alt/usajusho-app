"use client"

import { useEffect, useRef, useState } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Loader2 } from "lucide-react"
import type { BillingContact } from "@/lib/square"

// Square's Web Payments SDK (loaded from Square's own CDN below) renders
// the actual card-number/expiry/CVV inputs inside a small iframe it
// controls, for PCI compliance - but everything else (this dialog, the
// page around it, the domain in the address bar) stays on our own site.
// No redirect, unlike the old square.checkout.paymentLinks.create() flow.
//
// Docs: https://developer.squareup.com/docs/web-payments/overview

type SquareMode = "sandbox" | "production"

// One script tag for the whole page, however many SquareCardPayment
// instances get mounted (e.g. a list of payable rows) - subsequent
// mounts reuse the same cached load promise instead of re-injecting the
// script or racing on window.Square.
let squareScriptPromise: Promise<void> | null = null

function loadSquareScript(mode: SquareMode): Promise<void> {
  if (squareScriptPromise) return squareScriptPromise

  squareScriptPromise = new Promise((resolve, reject) => {
    if (typeof window !== "undefined" && window.Square) {
      resolve()
      return
    }
    const script = document.createElement("script")
    script.src =
      mode === "production"
        ? "https://web.squarecdn.com/v1/square.js"
        : "https://sandbox.web.squarecdn.com/v1/square.js"
    script.async = true
    script.onload = () => resolve()
    script.onerror = () => reject(new Error("Failed to load Square.js"))
    document.head.appendChild(script)
  })

  return squareScriptPromise
}

declare global {
  interface Window {
    Square?: {
      payments: (
        applicationId: string,
        locationId: string,
      ) => Promise<{
        setLocale: (locale: string) => void
        card: (options?: { postalCode?: string }) => Promise<{
          attach: (selector: string | HTMLElement) => Promise<void>
          destroy: () => Promise<void>
          tokenize: (verificationDetails?: {
            amount: string
            currencyCode: string
            intent: "CHARGE"
            billingContact?: BillingContact
            customerInitiated?: boolean
            sellerKeyedIn?: boolean
          }) => Promise<{
            status: string
            token?: string
            errors?: { message: string }[]
          }>
        }>
      }>
    }
  }
}

export default function SquareCardPayment({
  mode,
  applicationId,
  locationId,
  action,
  triggerLabel,
  dialogTitle,
  amountLabel,
  amount,
  billingContact,
  postalCodeHint,
  submitLabel,
  submittingLabel,
  genericErrorLabel,
  successLabel,
  onSuccess,
}: {
  mode: SquareMode
  applicationId: string
  locationId: string
  action: (sourceId: string) => Promise<{ error?: string; success?: boolean }>
  triggerLabel: string
  dialogTitle: string
  amountLabel: string
  amount: string
  billingContact?: BillingContact
  postalCodeHint?: string
  submitLabel: string
  submittingLabel: string
  genericErrorLabel: string
  successLabel: string
  onSuccess?: () => void
}) {
  const [open, setOpen] = useState(false)
  const [status, setStatus] = useState<
    "loading" | "ready" | "submitting" | "success" | "error"
  >("loading")
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const containerRef = useRef<HTMLDivElement | null>(null)
  const cardRef = useRef<Awaited<
    ReturnType<
      Awaited<ReturnType<NonNullable<Window["Square"]>["payments"]>>["card"]
    >
  > | null>(null)

  useEffect(() => {
    if (!open) return

    let cancelled = false

    async function setup() {
      try {
        await loadSquareScript(mode)
        if (cancelled || !window.Square) return
        const payments = await window.Square.payments(applicationId, locationId)
          // USAJUSHO customers are all in Japan; force the card form's
          // language rather than relying on navigator.language, which can
          // be English even for a Japanese cardholder's browser.
          payments.setLocale("ja-JP")
        // Prefill the visible postal-code box with the customer's own
      // Japan postal code (already on file from their profile) so
      // Japanese cardholders are not stuck guessing what to type into
      // a field that reads like a US ZIP code.
      const card = await payments.card(
        billingContact?.postalCode ? { postalCode: billingContact.postalCode } : undefined
      )
        if (cancelled) return
        if (containerRef.current) {
          await card.attach(containerRef.current)
        }
        cardRef.current = card
        if (!cancelled) setStatus("ready")
      } catch {
        if (!cancelled) {
          setStatus("error")
          setErrorMessage(genericErrorLabel)
        }
      }
    }

    setup()

    return () => {
      cancelled = true
      cardRef.current?.destroy().catch(() => {})
      cardRef.current = null
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, mode, applicationId, locationId, billingContact?.postalCode])

  async function handleSubmit() {
    if (!cardRef.current) return
    setStatus("submitting")
    setErrorMessage(null)

      try {
        // Strong Customer Authentication (3D Secure) has been mandatory for
        // Japanese-issued cards since April 1, 2025 (see
        // https://developer.squareup.com/docs/sca-overview). Passing amount +
        // billingContact lets Square run the 3DS challenge inline during
        // tokenize() instead of the charge being declined later.
        const result = await cardRef.current.tokenize({
          amount,
          currencyCode: "USD",
          intent: "CHARGE",
          billingContact,
          customerInitiated: true,
          sellerKeyedIn: false,
        })
        if (result.status !== "OK" || !result.token) {
        setStatus("ready")
        setErrorMessage(result.errors?.[0]?.message ?? genericErrorLabel)
        return
      }

      const actionResult = await action(result.token)
      if (actionResult?.error) {
        setStatus("ready")
        setErrorMessage(actionResult.error)
        return
      }

      setStatus("success")
      onSuccess?.()
    } catch {
      setStatus("ready")
      setErrorMessage(genericErrorLabel)
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next)
        if (!next) {
          // Reset so re-opening mounts a fresh card element instead of
          // showing a stale success/error state from the last attempt.
          setStatus("loading")
          setErrorMessage(null)
        }
      }}
    >
      <DialogTrigger asChild>
        <Button type="button" size="sm">
          {triggerLabel}
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{dialogTitle}</DialogTitle>
          <DialogDescription>{amountLabel}</DialogDescription>
        </DialogHeader>

        {status === "success" ? (
          <p className="py-4 text-sm text-accent">{successLabel}</p>
        ) : (
          <>
            <div ref={containerRef} className="min-h-[90px] py-2" />
            {postalCodeHint && (
              <p className="mt-1 text-xs text-muted-foreground">{postalCodeHint}</p>
            )}
            {status === "loading" && (
              <p className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                {submittingLabel}
              </p>
            )}
            {errorMessage && (
              <p className="text-sm text-destructive">{errorMessage}</p>
            )}
          </>
        )}

        {status !== "success" && (
          <DialogFooter>
            <Button
              type="button"
              onClick={handleSubmit}
              disabled={status === "loading" || status === "submitting"}
            >
              {status === "submitting" && (
                <Loader2 className="h-4 w-4 animate-spin" />
              )}
              {status === "submitting" ? submittingLabel : submitLabel}
            </Button>
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  )
}
