"use client"

import { useState, useTransition } from "react"
import { useTranslations } from "next-intl"
import { setSquareMode } from "./actions"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Loader2 } from "lucide-react"

type SquareMode = "sandbox" | "production"

export default function SquareModeToggle({
  initialMode,
}: {
  initialMode: SquareMode
}) {
  const t = useTranslations("adminPurchaseRequests")
  const [mode, setMode] = useState<SquareMode>(initialMode)
  const [isPending, startTransition] = useTransition()
  const [message, setMessage] = useState<
    { type: "error" | "success"; text: string } | null
  >(null)
  const [confirmOpen, setConfirmOpen] = useState(false)

  function applyMode(nextMode: SquareMode) {
    setMessage(null)
    startTransition(async () => {
      const result = await setSquareMode(nextMode)
      if (result?.error) {
        setMessage({ type: "error", text: result.error })
        return
      }
      setMode(nextMode)
      setMessage({
        type: "success",
        text:
          nextMode === "production"
            ? t("squareModeSwitchedProduction")
            : t("squareModeSwitchedSandbox"),
      })
    })
  }

  function handleToggleClick() {
    if (mode === "sandbox") {
      // Switching to Production has real-money implications, so require an
      // explicit confirmation first.
      setConfirmOpen(true)
    } else {
      applyMode("sandbox")
    }
  }

  return (
    <Card className="mt-6">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          {t("squareModeHeading")}
          <Badge variant={mode === "production" ? "destructive" : "secondary"}>
            {mode === "production" ? t("squareModeProduction") : t("squareModeSandbox")}
          </Badge>
        </CardTitle>
        <CardDescription>{t("squareModeDescription")}</CardDescription>
      </CardHeader>

      <CardContent>
        <Button
          type="button"
          variant={mode === "sandbox" ? "default" : "outline"}
          disabled={isPending}
          onClick={handleToggleClick}
        >
          {isPending && <Loader2 className="h-4 w-4 animate-spin" />}
          {mode === "sandbox"
            ? t("squareModeSwitchToProduction")
            : t("squareModeSwitchToSandbox")}
        </Button>
      </CardContent>

      <CardFooter className="flex-col items-start gap-2">
        {message && (
          <p
            className={
              message.type === "error"
                ? "text-sm text-destructive"
                : "text-sm text-accent"
            }
          >
            {message.text}
          </p>
        )}
      </CardFooter>

      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("squareModeConfirmTitle")}</DialogTitle>
            <DialogDescription>
              {t("squareModeConfirmDescription")}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setConfirmOpen(false)}
            >
              {t("squareModeConfirmCancel")}
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={() => {
                setConfirmOpen(false)
                applyMode("production")
              }}
            >
              {t("squareModeConfirmSwitch")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  )
}
