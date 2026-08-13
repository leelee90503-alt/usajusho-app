'use client'

import { useRef, useState, useTransition } from "react"
import { useTranslations } from "next-intl"
import { createDeclaration } from "./actions"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardAction, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import CarrierTrackLink from "@/components/carrier-track-link"
import { Loader2, Plus, Trash2 } from "lucide-react"

type ItemRow = { key: number; product_name: string; quantity: string; unit_price: string }

let rowKeySeq = 0
function blankRow(): ItemRow {
  rowKeySeq += 1
  return { key: rowKeySeq, product_name: "", quantity: "1", unit_price: "" }
}

export default function DeclarationForm({ onClose }: { onClose?: () => void }) {
  const t = useTranslations("packageDeclarations")
  const formRef = useRef<HTMLFormElement>(null)
  const [isPending, startTransition] = useTransition()
  const [message, setMessage] = useState<{ type: "error" | "success"; text: string } | null>(null)
  const [tracking, setTracking] = useState("")
  const [items, setItems] = useState<ItemRow[]>(() => [blankRow()])

  function updateItem(key: number, field: "product_name" | "quantity" | "unit_price", value: string) {
    setItems((prev) => prev.map((row) => (row.key === key ? { ...row, [field]: value } : row)))
  }

  function addItemRow() {
    setItems((prev) => [...prev, blankRow()])
  }

  function removeItemRow(key: number) {
    setItems((prev) => (prev.length > 1 ? prev.filter((row) => row.key !== key) : prev))
  }

  function handleSubmit(formData: FormData) {
    setMessage(null)

    const validItems = items
      .filter((row) => row.product_name.trim())
      .map((row) => ({
        product_name: row.product_name.trim(),
        quantity: Number(row.quantity) || 1,
        unit_price: row.unit_price.trim() ? Number(row.unit_price) : null,
      }))

    if (validItems.length === 0) {
      setMessage({ type: "error", text: t("itemsRequired") })
      return
    }

    formData.set("items", JSON.stringify(validItems))

    startTransition(async () => {
      const result = await createDeclaration(formData)
      if (result?.error) {
        setMessage({ type: "error", text: result.error })
      } else {
        setMessage({ type: "success", text: t("success") })
        formRef.current?.reset()
        setTracking("")
        setItems([blankRow()])
      }
    })
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("formHeading")}</CardTitle>
        {onClose && (
          <CardAction>
            <Button type="button" variant="ghost" size="sm" onClick={onClose}>
              {t("cancel")}
            </Button>
          </CardAction>
        )}
      </CardHeader>
      <form ref={formRef} action={handleSubmit}>
        <CardContent className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="space-y-1.5 sm:col-span-2">
            <Label>{t("itemsLabel")}</Label>
            <div className="rounded-lg border border-slate-200">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t("itemProductNameLabel")}</TableHead>
                    <TableHead>{t("itemQuantityLabel")}</TableHead>
                    <TableHead>{t("itemUnitPriceLabel")}</TableHead>
                    <TableHead />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {items.map((row) => (
                    <TableRow key={row.key}>
                      <TableCell>
                        <Input
                          value={row.product_name}
                          onChange={(e) => updateItem(row.key, "product_name", e.target.value)}
                          placeholder={t("itemProductNameLabel")}
                        />
                      </TableCell>
                      <TableCell>
                        <Input
                          type="number"
                          min="1"
                          className="w-20"
                          value={row.quantity}
                          onChange={(e) => updateItem(row.key, "quantity", e.target.value)}
                        />
                      </TableCell>
                      <TableCell>
                        <Input
                          type="number"
                          step="0.01"
                          min="0"
                          className="w-24"
                          value={row.unit_price}
                          onChange={(e) => updateItem(row.key, "unit_price", e.target.value)}
                          placeholder="0.00"
                        />
                      </TableCell>
                      <TableCell>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon-sm"
                          disabled={items.length === 1}
                          onClick={() => removeItemRow(row.key)}
                          aria-label={t("itemRemoveLabel")}
                          className="text-destructive hover:text-destructive"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            <Button type="button" variant="outline" size="sm" onClick={addItemRow}>
              <Plus className="h-4 w-4" />
              {t("itemAddLabel")}
            </Button>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="decl-tracking">{t("trackingLabel")}</Label>
            <Input
              id="decl-tracking"
              name="origin_tracking_number"
              value={tracking}
              onChange={(e) => setTracking(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">{t("trackingHint")}</p>
            <CarrierTrackLink trackingNumber={tracking} className="text-xs" />
          </div>

          <div className="space-y-1.5 sm:col-span-2">
            <Label htmlFor="decl-note">{t("noteLabel")}</Label>
            <Textarea id="decl-note" name="note" rows={3} />
          </div>

          <div className="space-y-1.5 sm:col-span-2">
            <Label htmlFor="decl-receipt">{t("receiptLabel")}</Label>
            <Input id="decl-receipt" name="receipt" type="file" accept="image/*,.pdf" />
          </div>

          {message && (
            <p
              className={`sm:col-span-2 text-sm ${
                message.type === "error" ? "text-destructive" : "text-accent"
              }`}
            >
              {message.text}
            </p>
          )}

          <Button type="submit" disabled={isPending} className="sm:col-span-2">
            {isPending && <Loader2 className="h-4 w-4 animate-spin" />}
            {isPending ? t("submitting") : t("submit")}
          </Button>
        </CardContent>
      </form>
    </Card>
  )
}
