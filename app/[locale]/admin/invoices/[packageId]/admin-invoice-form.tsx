"use client"

import { useState, useTransition, useRef } from "react"
import {
  adminUpdateInvoiceHeader,
  adminAddInvoiceItem,
  adminUpdateInvoiceItem,
  adminDeleteInvoiceItem,
  adminDuplicateInvoiceItem,
  adminImportItemsFromPackage,
  adminSubmitOnBehalf,
  adminRequestCorrection,
  adminApproveAndComplete,
} from "../actions"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
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
import { Trash2, Copy } from "lucide-react"

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
  package_id: string
}

type Labels = Record<string, string>

const STATUS_LABEL_KEY: Record<string, string> = {
  draft: "statusDraft",
  customer_submitted: "statusSubmitted",
  correction_required: "statusCorrectionRequired",
  admin_review: "statusAdminReview",
  complete: "statusComplete",
}

const STATUS_BADGE_CLASS: Record<string, string> = {
  draft: "bg-slate-100 text-slate-700",
  customer_submitted: "bg-slate-100 text-slate-700",
  correction_required: "bg-amber-100 text-amber-800",
  admin_review: "bg-slate-100 text-slate-700",
  complete: "bg-teal-100 text-teal-800",
}

export default function AdminInvoiceForm({
  invoice: initialInvoice,
  labels,
}: {
  invoice: Invoice
  labels: Labels
}) {
  const [invoice, setInvoice] = useState(initialInvoice)
  const savedInvoiceRef = useRef(initialInvoice)
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)
  const [newItem, setNewItem] = useState({
    product_name: "",
    quantity: "1",
    unit_price: "0",
    country_of_origin: "",
    hs_code: "",
  })
  const [correctionNote, setCorrectionNote] = useState("")
  const [showCorrectionBox, setShowCorrectionBox] = useState(false)
  const [confirmAction, setConfirmAction] = useState<null | "submit" | "complete">(null)
  const [editWhenCompleteConfirmed, setEditWhenCompleteConfirmed] = useState(false)

  const items = [...invoice.invoice_items].sort((a, b) => a.sort_order - b.sort_order)
  const isComplete = invoice.status === "complete"

  function guardEditWhenComplete(): boolean {
    if (isComplete && !editWhenCompleteConfirmed) {
      const ok = window.confirm(labels.editCompleteConfirm)
      if (ok) {
        setEditWhenCompleteConfirmed(true)
        return true
      }
      return false
    }
    return true
  }

  function refreshField<K extends keyof Invoice>(key: K, value: Invoice[K]) {
    setInvoice((prev) => ({ ...prev, [key]: value }))
  }

  function handleHeaderBlur(field: string, value: string) {
    if (!guardEditWhenComplete()) {
      setInvoice((prev) => ({ ...prev, [field]: (savedInvoiceRef.current as any)[field] }))
      setError(labels.editCancelledError)
      return
    }
    startTransition(async () => {
      const res = await adminUpdateInvoiceHeader(invoice.id, { [field]: value })
      if (res?.error) setError(res.error)
      else {
        setError(null)
        savedInvoiceRef.current = { ...savedInvoiceRef.current, [field]: value }
      }
    })
  }

  function handleAddItem() {
    if (!guardEditWhenComplete()) return
    setError(null)
    startTransition(async () => {
      const res = await adminAddInvoiceItem(invoice.id, {
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
    if (!guardEditWhenComplete()) return
    startTransition(async () => {
      const res = await adminDeleteInvoiceItem(itemId)
      if (res?.error) setError(res.error)
      else window.location.reload()
    })
  }

  function handleDuplicateItem(itemId: string) {
    if (!guardEditWhenComplete()) return
    startTransition(async () => {
      const res = await adminDuplicateInvoiceItem(itemId)
      if (res?.error) setError(res.error)
      else window.location.reload()
    })
  }

  function handleImportFromPackage() {
    if (!guardEditWhenComplete()) return
    setError(null)
    startTransition(async () => {
      const res = await adminImportItemsFromPackage(invoice.id, invoice.package_id)
      if (res?.error) {
        setError(res.error)
        return
      }
      window.location.reload()
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
    if (!guardEditWhenComplete()) {
      setInvoice((prev) => ({
        ...prev,
        invoice_items: prev.invoice_items.map((it) => {
          if (it.id !== itemId) return it
          const savedItem = savedInvoiceRef.current.invoice_items.find((si) => si.id === itemId)
          return savedItem ? { ...it, [field]: (savedItem as any)[field] } : it
        }),
      }))
      setError(labels.editCancelledError)
      return
    }
    startTransition(async () => {
      const payload: Record<string, string | number> =
        field === "quantity" || field === "unit_price" ? { [field]: Number(value) } : { [field]: value }
      const res = await adminUpdateInvoiceItem(itemId, payload)
      if (res.error) {
        setError(res.error)
        return
      }
      setError(null)
      // Merge the server's saved values back in (item_total_amount and
      // total_declared_value are recomputed server-side) instead of
      // reloading the whole page -- a full reload here would wipe out
      // whatever the admin has already started typing into another item's
      // fields while this save was in flight.
      setInvoice((prev) => ({
        ...prev,
        total_declared_value: res.total_declared_value ?? prev.total_declared_value,
        invoice_items: prev.invoice_items.map((it) =>
          it.id === itemId && res.item ? { ...it, ...res.item } : it
        ),
      }))
      savedInvoiceRef.current = {
        ...savedInvoiceRef.current,
        total_declared_value: res.total_declared_value ?? savedInvoiceRef.current.total_declared_value,
        invoice_items: savedInvoiceRef.current.invoice_items.map((it) =>
          it.id === itemId && res.item ? { ...it, ...res.item } : it
        ),
      }
    })
  }

  function handleSubmitOnBehalf() {
    setError(null)
    startTransition(async () => {
      const res = await adminSubmitOnBehalf(invoice.id)
      if (res?.error) {
        setError(res.error)
        return
      }
      setConfirmAction(null)
      window.location.reload()
    })
  }

  function handleRequestCorrection() {
    if (!correctionNote.trim()) {
      setError(labels.correctionNoteRequired)
      return
    }
    setError(null)
    startTransition(async () => {
      const res = await adminRequestCorrection(invoice.id, correctionNote)
      if (res?.error) {
        setError(res.error)
        return
      }
      setNotice(labels.correctionSentSuccess)
      window.location.reload()
    })
  }

  function handleApproveComplete() {
    setError(null)
    startTransition(async () => {
      const res = await adminApproveAndComplete(invoice.id)
      if (res?.error) {
        setError(res.error)
        return
      }
      setConfirmAction(null)
      window.location.reload()
    })
  }

  return (
    <Card className="mt-8 print:hidden">
      <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-3 border-b border-border pb-4">
        <div>
          <h2 className="text-lg font-semibold text-foreground">{labels.title}</h2>
          {invoice.invoice_number && (
            <p className="mt-1 text-xs text-muted-foreground">{invoice.invoice_number}</p>
          )}
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <Badge className={`shrink-0 ${STATUS_BADGE_CLASS[invoice.status] ?? "bg-slate-100 text-slate-700"}`}>
            {labels[STATUS_LABEL_KEY[invoice.status]] || invoice.status}
          </Badge>
          <Button type="button" variant="outline" size="sm" onClick={() => window.print()}>
            {labels.printButton}
          </Button>
        </div>
      </CardHeader>

      <CardContent className="pt-6">
        {invoice.status === "correction_required" && invoice.correction_note && (
          <Alert className="mb-4 border-amber-200 bg-amber-50">
            <AlertDescription className="text-amber-800">
              <p className="font-semibold">{labels.correctionBannerTitle}</p>
              <p className="mt-1 text-amber-700">{invoice.correction_note}</p>
            </AlertDescription>
          </Alert>
        )}

        {error && (
          <Alert variant="destructive" className="mb-4">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        {notice && (
          <Alert className="mb-4 border-emerald-200 bg-emerald-50">
            <AlertDescription className="text-emerald-700">{notice}</AlertDescription>
          </Alert>
        )}

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <HeaderField
            label={labels.shipperName}
            value={invoice.shipper_name || ""}
            onChange={(v) => refreshField("shipper_name", v)}
            onBlur={(v) => handleHeaderBlur("shipper_name", v)}
          />
          <HeaderField
            label={labels.shipperAddress}
            value={invoice.shipper_address || ""}
            onChange={(v) => refreshField("shipper_address", v)}
            onBlur={(v) => handleHeaderBlur("shipper_address", v)}
          />
          <HeaderField
            label={labels.consigneeName}
            value={invoice.consignee_name || ""}
            onChange={(v) => refreshField("consignee_name", v)}
            onBlur={(v) => handleHeaderBlur("consignee_name", v)}
          />
          <HeaderField
            label={labels.consigneeAddress}
            value={invoice.consignee_address || ""}
            onChange={(v) => refreshField("consignee_address", v)}
            onBlur={(v) => handleHeaderBlur("consignee_address", v)}
          />
          <HeaderField
            label={labels.reasonForExport}
            value={invoice.reason_for_export || ""}
            onChange={(v) => refreshField("reason_for_export", v)}
            onBlur={(v) => handleHeaderBlur("reason_for_export", v)}
          />
          <HeaderField
            label={labels.shippingTerms}
            value={invoice.shipping_terms || ""}
            onChange={(v) => refreshField("shipping_terms", v)}
            onBlur={(v) => handleHeaderBlur("shipping_terms", v)}
          />
        </div>

        <div className="mt-8">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h3 className="text-sm font-semibold text-foreground">{labels.lineItemsTitle}</h3>
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={isPending}
              onClick={handleImportFromPackage}
            >
              {labels.importFromPackageButton}
            </Button>
          </div>
          <div className="mt-3 overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{labels.productName}</TableHead>
                  <TableHead>{labels.quantity}</TableHead>
                  <TableHead>{labels.unitPrice}</TableHead>
                  <TableHead>{labels.itemTotal}</TableHead>
                  <TableHead>{labels.countryOfOrigin}</TableHead>
                  <TableHead>{labels.hsCode}</TableHead>
                  <TableHead className="text-right" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell>
                      <Input
                        className="w-full"
                        value={item.product_name}
                        onChange={(e) => handleItemFieldChange(item.id, "product_name", e.target.value)}
                        onBlur={(e) => handleItemBlur(item.id, "product_name", e.target.value)}
                      />
                    </TableCell>
                    <TableCell>
                      <Input
                        type="number"
                        className="w-20"
                        value={item.quantity}
                        onChange={(e) => handleItemFieldChange(item.id, "quantity", e.target.value)}
                        onBlur={(e) => handleItemBlur(item.id, "quantity", e.target.value)}
                      />
                    </TableCell>
                    <TableCell>
                      <Input
                        type="number"
                        className="w-24"
                        value={item.unit_price}
                        onChange={(e) => handleItemFieldChange(item.id, "unit_price", e.target.value)}
                        onBlur={(e) => handleItemBlur(item.id, "unit_price", e.target.value)}
                      />
                    </TableCell>
                    <TableCell className="font-medium text-foreground">
                      {labels.currencySymbol}
                      {formatUSD(item.item_total_amount)}
                    </TableCell>
                    <TableCell>
                      <Input
                        className="w-24"
                        value={item.country_of_origin || ""}
                        onChange={(e) => handleItemFieldChange(item.id, "country_of_origin", e.target.value)}
                        onBlur={(e) => handleItemBlur(item.id, "country_of_origin", e.target.value)}
                      />
                    </TableCell>
                    <TableCell>
                      <Input
                        className="w-24"
                        value={item.hs_code || ""}
                        onChange={(e) => handleItemFieldChange(item.id, "hs_code", e.target.value)}
                        onBlur={(e) => handleItemBlur(item.id, "hs_code", e.target.value)}
                      />
                    </TableCell>
                    <TableCell className="text-right whitespace-nowrap">
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon-sm"
                        onClick={() => handleDuplicateItem(item.id)}
                        aria-label={labels.duplicate}
                      >
                        <Copy className="text-accent" />
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon-sm"
                        onClick={() => handleDeleteItem(item.id)}
                        aria-label={labels.delete}
                      >
                        <Trash2 className="text-destructive" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
                {items.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={7} className="py-4 text-center text-xs text-muted-foreground">
                      {labels.noItems}
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>

          <div className="mt-4 flex flex-wrap items-end gap-2 rounded-lg bg-muted/40 p-3">
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
        </div>

        <div className="mt-6 flex items-center justify-between border-t border-border pt-4">
          <p className="text-sm font-semibold text-foreground">{labels.totalDeclaredValue}</p>
          <p className="text-lg font-bold text-accent">
            {labels.currencySymbol}
            {formatUSD(invoice.total_declared_value)}
          </p>
        </div>

        <div className="mt-6 flex flex-wrap justify-end gap-3">
          {(invoice.status === "draft" || invoice.status === "correction_required") && (
            <Button type="button" disabled={isPending} onClick={() => setConfirmAction("submit")}>
              {labels.submitOnBehalf}
            </Button>
          )}

          {invoice.status === "customer_submitted" && (
            <>
              <Button
                type="button"
                variant="outline"
                disabled={isPending}
                onClick={() => setShowCorrectionBox((v) => !v)}
                className="border-amber-300 bg-amber-50 text-amber-800 hover:bg-amber-100"
              >
                {labels.requestCorrection}
              </Button>
              <Button type="button" disabled={isPending} onClick={() => setConfirmAction("complete")}>
                {labels.approveComplete}
              </Button>
            </>
          )}
        </div>

        {showCorrectionBox && (
          <div className="mt-4 rounded-lg border border-amber-200 bg-amber-50 p-4">
            <Label className="mb-1 text-xs font-medium text-amber-800">
              {labels.correctionNoteLabel}
            </Label>
            <Textarea
              className="border-amber-300"
              rows={3}
              value={correctionNote}
              onChange={(e) => setCorrectionNote(e.target.value)}
              placeholder={labels.correctionNotePlaceholder}
            />
            <div className="mt-3 flex justify-end gap-2">
              <Button type="button" variant="ghost" onClick={() => setShowCorrectionBox(false)}>
                {labels.cancel}
              </Button>
              <Button
                type="button"
                disabled={isPending}
                onClick={handleRequestCorrection}
                className="bg-amber-700 hover:bg-amber-800"
              >
                {labels.sendCorrection}
              </Button>
            </div>
          </div>
        )}
      </CardContent>

      <Dialog open={confirmAction !== null} onOpenChange={(open) => !open && setConfirmAction(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {confirmAction === "submit" ? labels.submitOnBehalfConfirmTitle : labels.approveCompleteConfirmTitle}
            </DialogTitle>
            <DialogDescription>
              {confirmAction === "submit" ? labels.submitOnBehalfConfirmBody : labels.approveCompleteConfirmBody}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setConfirmAction(null)}>
              {labels.cancel}
            </Button>
            <Button
              type="button"
              disabled={isPending}
              onClick={confirmAction === "submit" ? handleSubmitOnBehalf : handleApproveComplete}
            >
              {labels.confirm}
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
  onChange,
  onBlur,
}: {
  label: string
  value: string
  onChange: (v: string) => void
  onBlur: (v: string) => void
}) {
  return (
    <div className="space-y-1.5">
      <Label>{label}</Label>
      <Input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onBlur={(e) => onBlur(e.target.value)}
      />
    </div>
  )
}
