"use client"

import { useState, useTransition } from "react"
import {
  updateInvoiceHeader,
  addInvoiceItem,
  updateInvoiceItem,
  deleteInvoiceItem,
  duplicateInvoiceItem,
  submitInvoice,
} from "./invoice-actions"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { formatUSD } from "@/lib/format"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { AlertTriangle, Copy, Trash2 } from "lucide-react"

type InvoiceItem = {
  id: string
  product_name: string
  quantity: number
  unit_price: number
  item_total_amount: number
  country_of_origin: string | null
  hs_code: string | null
  sort_order: number
}

type Invoice = {
  id: string
  status: string
  invoice_number: string | null
  invoice_issue_date: string | null
  shipment_reference_number: string | null
  shipper_name: string | null
  shipper_address: string | null
  consignee_name: string | null
  consignee_address: string | null
  reason_for_export: string | null
  currency: string
  shipping_terms: string | null
  shipping_cost: number | null
  insurance_premium: number | null
  other_costs: number | null
  total_declared_value: number
  correction_note: string | null
  invoice_items: InvoiceItem[]
}

type Labels = Record<string, string>

const STATUS_LABEL_KEY: Record<string, string> = {
  draft: "statusDraft",
  customer_submitted: "statusSubmitted",
  correction_required: "statusCorrectionRequired",
  admin_review: "statusAdminReview",
  complete: "statusComplete",
}

const STATUS_BADGE_VARIANT: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  draft: "outline",
  customer_submitted: "secondary",
  correction_required: "destructive",
  admin_review: "secondary",
  complete: "default",
}

export default function InvoiceForm({
  invoice: initialInvoice,
  labels,
}: {
  invoice: Invoice
  labels: Labels
}) {
  const [invoice, setInvoice] = useState(initialInvoice)
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [newItem, setNewItem] = useState({
    product_name: "",
    quantity: "1",
    unit_price: "0",
    country_of_origin: "",
    hs_code: "",
  })

  const isMutable = invoice.status === "draft" || invoice.status === "correction_required"
  const items = [...invoice.invoice_items].sort((a, b) => a.sort_order - b.sort_order)

  function refreshField<K extends keyof Invoice>(key: K, value: Invoice[K]) {
    setInvoice((prev) => ({ ...prev, [key]: value }))
  }

  function handleHeaderBlur(field: string, value: string) {
    if (!isMutable) return
    startTransition(async () => {
      const res = await updateInvoiceHeader(invoice.id, { [field]: value })
      if (res?.error) setError(res.error)
      else setError(null)
    })
  }

  function handleAddItem() {
    if (!isMutable) return
    setError(null)
    startTransition(async () => {
      const res = await addInvoiceItem(invoice.id, {
        product_name: newItem.product_name,
        quantity: Number(newItem.quantity),
        unit_price: Number(newItem.unit_price),
        country_of_origin: newItem.country_of_origin || undefined,
        hs_code: newItem.hs_code || undefined,
      })
      if (res?.error) {
        setError(res.error)
        return
      }
      setNewItem({ product_name: "", quantity: "1", unit_price: "0", country_of_origin: "", hs_code: "" })
      window.location.reload()
    })
  }

  function handleDeleteItem(itemId: string) {
    if (!isMutable) return
    startTransition(async () => {
      const res = await deleteInvoiceItem(itemId)
      if (res?.error) setError(res.error)
      else window.location.reload()
    })
  }

  function handleDuplicateItem(itemId: string) {
    if (!isMutable) return
    startTransition(async () => {
      const res = await duplicateInvoiceItem(itemId)
      if (res?.error) setError(res.error)
      else window.location.reload()
    })
  }

  function handleItemFieldChange(itemId: string, field: string, value: string) {
    setInvoice((prev) => ({
      ...prev,
      invoice_items: prev.invoice_items.map((it) =>
        it.id === itemId ? { ...it, [field]: value } : it
      ),
    }))
  }

  function handleItemBlur(itemId: string, field: string, value: string) {
    if (!isMutable) return
    startTransition(async () => {
      const payload: Record<string, string | number> =
        field === "quantity" || field === "unit_price" ? { [field]: Number(value) } : { [field]: value }
      const res = await updateInvoiceItem(itemId, payload)
      if (res?.error) setError(res.error)
      else window.location.reload()
    })
  }

  const [confirmOpen, setConfirmOpen] = useState(false)
  const [certAccepted, setCertAccepted] = useState(false)
  const [signature, setSignature] = useState("")

  function handleSubmit() {
    setError(null)
    startTransition(async () => {
      const res = await submitInvoice(invoice.id, {
        certificationAccepted: certAccepted,
        customerSignature: signature,
      })
      if (res?.error) {
        setError(res.error)
        return
      }
      setConfirmOpen(false)
      window.location.reload()
    })
  }

  return (
    <Card className="mt-8">
      <CardHeader className="flex flex-row items-center justify-between gap-3 border-b">
        <div>
          <CardTitle>{labels.title}</CardTitle>
          {invoice.invoice_number && (
            <p className="mt-1 text-xs text-muted-foreground">{invoice.invoice_number}</p>
          )}
        </div>
        <Badge variant={STATUS_BADGE_VARIANT[invoice.status] ?? "outline"}>
          {labels[STATUS_LABEL_KEY[invoice.status]] || invoice.status}
        </Badge>
      </CardHeader>

      <CardContent className="space-y-6">
        {invoice.status === "correction_required" && invoice.correction_note && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>{labels.correctionBannerTitle}</AlertTitle>
            <AlertDescription>{invoice.correction_note}</AlertDescription>
          </Alert>
        )}

        <div className="rounded-lg bg-slate-50 p-4 text-xs text-muted-foreground space-y-1">
          <p>{labels.noticeWhyNeeded}</p>
          <p>{labels.noticeEnglishRequired}</p>
          <p>{labels.noticeAccurateValue}</p>
          <p>{labels.noticeCustomsDuties}</p>
          <p>{labels.noticeProhibitedItems}</p>
          <p>{labels.noticeCorrections}</p>
        </div>

        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <HeaderField
            label={labels.shipperName}
            value={invoice.shipper_name || ""}
            disabled={!isMutable}
            onChange={(v) => refreshField("shipper_name", v)}
            onBlur={(v) => handleHeaderBlur("shipper_name", v)}
          />
          <HeaderField
            label={labels.shipperAddress}
            value={invoice.shipper_address || ""}
            disabled={!isMutable}
            onChange={(v) => refreshField("shipper_address", v)}
            onBlur={(v) => handleHeaderBlur("shipper_address", v)}
          />

          <HeaderField
            label={labels.consigneeName}
            value={invoice.consignee_name || ""}
            disabled={!isMutable}
            onChange={(v) => refreshField("consignee_name", v)}
            onBlur={(v) => handleHeaderBlur("consignee_name", v)}
          />
          <HeaderField
            label={labels.consigneeAddress}
            value={invoice.consignee_address || ""}
            disabled={!isMutable}
            onChange={(v) => refreshField("consignee_address", v)}
            onBlur={(v) => handleHeaderBlur("consignee_address", v)}
          />
          <HeaderField
            label={labels.reasonForExport}
            value={invoice.reason_for_export || ""}
            disabled={!isMutable}
            onChange={(v) => refreshField("reason_for_export", v)}
            onBlur={(v) => handleHeaderBlur("reason_for_export", v)}
          />
          <HeaderField
            label={labels.shippingTerms}
            value={invoice.shipping_terms || ""}
            disabled={!isMutable}
            onChange={(v) => refreshField("shipping_terms", v)}
            onBlur={(v) => handleHeaderBlur("shipping_terms", v)}
          />
        </div>

        <div>
          <h3 className="text-sm font-semibold text-slate-900">{labels.lineItemsTitle}</h3>
          <div className="mt-3 rounded-lg border border-slate-200">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{labels.productName}</TableHead>
                  <TableHead>{labels.quantity}</TableHead>
                  <TableHead>{labels.unitPrice}</TableHead>
                  <TableHead>{labels.itemTotal}</TableHead>
                  <TableHead>{labels.countryOfOrigin}</TableHead>
                  <TableHead>{labels.hsCode}</TableHead>
                  <TableHead />
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell>
                      <Input
                        value={item.product_name}
                        disabled={!isMutable}
                        onChange={(e) => handleItemFieldChange(item.id, "product_name", e.target.value)}
                        onBlur={(e) => handleItemBlur(item.id, "product_name", e.target.value)}
                      />
                    </TableCell>
                    <TableCell>
                      <Input
                        type="number"
                        className="w-20"
                        value={item.quantity}
                        disabled={!isMutable}
                        onChange={(e) => handleItemFieldChange(item.id, "quantity", e.target.value)}
                        onBlur={(e) => handleItemBlur(item.id, "quantity", e.target.value)}
                      />
                    </TableCell>
                    <TableCell>
                      <Input
                        type="number"
                        className="w-24"
                        value={item.unit_price}
                        disabled={!isMutable}
                        onChange={(e) => handleItemFieldChange(item.id, "unit_price", e.target.value)}
                        onBlur={(e) => handleItemBlur(item.id, "unit_price", e.target.value)}
                      />
                    </TableCell>
                    <TableCell className="font-medium text-slate-700">
                      {labels.currencySymbol}
                      {formatUSD(item.item_total_amount)}
                    </TableCell>
                    <TableCell>
                      <Input
                        className="w-24"
                        value={item.country_of_origin || ""}
                        disabled={!isMutable}
                        onChange={(e) => handleItemFieldChange(item.id, "country_of_origin", e.target.value)}
                        onBlur={(e) => handleItemBlur(item.id, "country_of_origin", e.target.value)}
                      />
                    </TableCell>
                    <TableCell>
                      <Input
                        className="w-24"
                        value={item.hs_code || ""}
                        disabled={!isMutable}
                        onChange={(e) => handleItemFieldChange(item.id, "hs_code", e.target.value)}
                        onBlur={(e) => handleItemBlur(item.id, "hs_code", e.target.value)}
                      />
                    </TableCell>
                    <TableCell className="whitespace-nowrap">
                      {isMutable && (
                        <div className="flex items-center gap-1">
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon-sm"
                            onClick={() => handleDuplicateItem(item.id)}
                            aria-label={labels.duplicate}
                          >
                            <Copy className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon-sm"
                            onClick={() => handleDeleteItem(item.id)}
                            aria-label={labels.delete}
                            className="text-destructive hover:text-destructive"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
                {items.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center text-xs text-muted-foreground">
                      {labels.noItems}
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>

          {isMutable && (
            <div className="mt-4 flex flex-wrap items-end gap-2 rounded-lg bg-slate-50 p-3">
              <Input
                className="w-40"
                placeholder={labels.productName}
                value={newItem.product_name}
                onChange={(e) => setNewItem((s) => ({ ...s, product_name: e.target.value }))}
              />
              <Input
                type="number"
                className="w-20"
                placeholder={labels.quantity}
                value={newItem.quantity}
                onChange={(e) => setNewItem((s) => ({ ...s, quantity: e.target.value }))}
              />
              <Input
                type="number"
                className="w-24"
                placeholder={labels.unitPrice}
                value={newItem.unit_price}
                onChange={(e) => setNewItem((s) => ({ ...s, unit_price: e.target.value }))}
              />
              <Input
                className="w-24"
                placeholder={labels.countryOfOrigin}
                value={newItem.country_of_origin}
                onChange={(e) => setNewItem((s) => ({ ...s, country_of_origin: e.target.value }))}
              />
              <Input
                className="w-24"
                placeholder={labels.hsCode}
                value={newItem.hs_code}
                onChange={(e) => setNewItem((s) => ({ ...s, hs_code: e.target.value }))}
              />
              <Button
                type="button"
                disabled={isPending || !newItem.product_name.trim()}
                onClick={handleAddItem}
              >
                {labels.addItem}
              </Button>
            </div>
          )}
        </div>

        <div className="flex items-center justify-between border-t border-slate-200 pt-4">
          <p className="text-sm font-semibold text-slate-900">{labels.totalDeclaredValue}</p>
          <p className="text-lg font-bold text-primary">
            {labels.currencySymbol}
            {formatUSD(invoice.total_declared_value)}
          </p>
        </div>
      </CardContent>

      {isMutable && (
        <CardFooter className="justify-end gap-3">
          <Button type="button" disabled={isPending} onClick={() => setConfirmOpen(true)}>
            {labels.submit}
          </Button>
        </CardFooter>
      )}

      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{labels.submitConfirmTitle}</DialogTitle>
            <DialogDescription>{labels.submitConfirmBody}</DialogDescription>
          </DialogHeader>

          <Label className="flex items-start gap-2 text-sm font-normal text-slate-700">
            <input
              type="checkbox"
              checked={certAccepted}
              onChange={(e) => setCertAccepted(e.target.checked)}
              className="mt-1"
            />
            {labels.certificationStatement}
          </Label>

          <Input
            placeholder={labels.customerSignature}
            value={signature}
            onChange={(e) => setSignature(e.target.value)}
          />

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setConfirmOpen(false)}>
              {labels.cancel}
            </Button>
            <Button
              type="button"
              disabled={!certAccepted || !signature.trim() || isPending}
              onClick={handleSubmit}
            >
              {labels.confirmSubmit}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  )
}

function HeaderField({
  label,
  value,
  disabled,
  onChange,
  onBlur,
}: {
  label: string
  value: string
  disabled: boolean
  onChange: (v: string) => void
  onBlur: (v: string) => void
}) {
  return (
    <div className="space-y-1.5">
      <Label>{label}</Label>
      <Input
        value={value}
        disabled={disabled}
        onChange={(e) => onChange(e.target.value)}
        onBlur={(e) => onBlur(e.target.value)}
      />
    </div>
  )
}
