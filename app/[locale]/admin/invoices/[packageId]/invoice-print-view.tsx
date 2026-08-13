import { formatUSD } from "@/lib/format"

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
  invoice_number: string | null
  invoice_issue_date: string | null
  shipper_name: string | null
  shipper_address: string | null
  consignee_name: string | null
  consignee_address: string | null
  reason_for_export: string | null
  shipping_terms: string | null
  total_declared_value: number
  invoice_items: InvoiceItem[]
}

type Labels = Record<string, string>

// Print-only view: hidden on screen, shown only via the browser's print
// media query (Tailwind's `print:` variant). Keeping this separate from
// the editable AdminInvoiceForm means printing never includes input boxes,
// the line-item editor, or admin action buttons -- only a clean, formatted
// Commercial Invoice.
export default function InvoicePrintView({
  invoice,
  labels,
}: {
  invoice: Invoice
  labels: Labels
}) {
  const items = [...invoice.invoice_items].sort((a, b) => a.sort_order - b.sort_order)

  return (
    <div className="hidden print:block print:p-8 print:text-black">
      <div className="flex items-start justify-between border-b border-black pb-4">
        <div>
          <h1 className="text-[18px] font-bold">{labels.title}</h1>
          {invoice.invoice_number && <p className="mt-1 text-[10px]">{invoice.invoice_number}</p>}
        </div>
        {invoice.invoice_issue_date && (
          <p className="text-[10px]">
            {labels.invoiceDateLabel}: {invoice.invoice_issue_date}
          </p>
        )}
      </div>

      <div className="mt-6 grid grid-cols-2 gap-8">
        <div>
          <p className="text-[9px] font-semibold uppercase tracking-wide">{labels.shipperName}</p>
          <p className="mt-1 whitespace-pre-line text-[10px]">{invoice.shipper_name}</p>
          <p className="mt-1 whitespace-pre-line text-[10px]">{invoice.shipper_address}</p>
        </div>
        <div>
          <p className="text-[9px] font-semibold uppercase tracking-wide">{labels.consigneeName}</p>
          <p className="mt-1 whitespace-pre-line text-[10px]">{invoice.consignee_name}</p>
          <p className="mt-1 whitespace-pre-line text-[10px]">{invoice.consignee_address}</p>
        </div>
      </div>

      <div className="mt-6 grid grid-cols-2 gap-8 text-[10px]">
        <p>
          <span className="font-semibold">{labels.reasonForExport}: </span>
          {invoice.reason_for_export}
        </p>
        <p>
          <span className="font-semibold">{labels.shippingTerms}: </span>
          {invoice.shipping_terms}
        </p>
      </div>

      <table className="mt-6 w-full border-collapse text-[10px]">
        <thead>
          <tr className="border-b-2 border-black">
            <th className="py-1.5 text-left font-semibold">{labels.productName}</th>
            <th className="py-1.5 pl-2 text-right font-semibold">{labels.quantity}</th>
            <th className="py-1.5 pl-2 text-right font-semibold">{labels.unitPrice}</th>
            <th className="py-1.5 pl-2 text-right font-semibold">{labels.itemTotal}</th>
            <th className="py-1.5 pl-2 text-left font-semibold">{labels.countryOfOrigin}</th>
            <th className="py-1.5 pl-2 text-left font-semibold">{labels.hsCode}</th>
          </tr>
        </thead>
        <tbody>
          {items.map((item) => (
            <tr key={item.id} className="border-b border-slate-300">
              <td className="py-1.5">{item.product_name}</td>
              <td className="py-1.5 pl-2 text-right">{item.quantity}</td>
              <td className="py-1.5 pl-2 text-right">
                {labels.currencySymbol}
                {formatUSD(item.unit_price)}
              </td>
              <td className="py-1.5 pl-2 text-right">
                {labels.currencySymbol}
                {formatUSD(item.item_total_amount)}
              </td>
              <td className="py-1.5 pl-2">{item.country_of_origin}</td>
              <td className="py-1.5 pl-2">{item.hs_code}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="mt-6 flex justify-end border-t-2 border-black pt-3">
        <div className="text-right">
          <p className="text-[10px] font-semibold">{labels.totalDeclaredValue}</p>
          <p className="text-[16px] font-bold">
            {labels.currencySymbol}
            {formatUSD(invoice.total_declared_value)}
          </p>
        </div>
      </div>
    </div>
  )
}
