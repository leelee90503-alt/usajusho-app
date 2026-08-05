import type {
  Callout,
  Category,
  CategoryBlock,
  ChipStatus,
  CustomsDoc,
  TableBlock,
} from "@/content/customs/types"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { AlertTriangle, CheckCircle2, XCircle } from "lucide-react"

const STATUS_STYLES: Record<
  ChipStatus,
  { badge: string; icon: typeof CheckCircle2 }
> = {
  go: {
    badge: "border-transparent bg-emerald-100 text-emerald-800",
    icon: CheckCircle2,
  },
  warn: {
    badge: "border-transparent bg-amber-100 text-amber-800",
    icon: AlertTriangle,
  },
  stop: {
    badge: "border-transparent bg-red-100 text-red-700",
    icon: XCircle,
  },
}

function StatusBadge({
  status,
  label,
}: {
  status: ChipStatus
  label: string
}) {
  const style = STATUS_STYLES[status]
  const Icon = style.icon
  return (
    <Badge className={`gap-1 rounded-full px-2.5 py-0.5 ${style.badge}`}>
      <Icon className="h-3 w-3" aria-hidden="true" />
      {label}
    </Badge>
  )
}

function DataTable({ table }: { table: TableBlock }) {
  return (
    <div className="my-4 overflow-x-auto rounded-lg border border-slate-200">
      <table className="w-full min-w-[420px] border-collapse text-sm">
        <thead>
          <tr className="bg-[var(--usj-surface)]">
            {table.head.map((h, i) => (
              <th
                key={i}
                className="border-b border-slate-200 px-3 py-2 text-left font-semibold text-slate-700"
              >
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {table.rows.map((row, ri) => (
            <tr key={ri} className="odd:bg-white even:bg-slate-50/60">
              {row.map((cell, ci) => (
                <td
                  key={ci}
                  className="border-b border-slate-100 px-3 py-2 text-slate-700 last:font-medium"
                >
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      {table.caption ? (
        <p className="border-t border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-500">
          {table.caption}
        </p>
      ) : null}
    </div>
  )
}

function CalloutBox({ callout }: { callout: Callout }) {
  return (
    <div className="my-4 rounded-lg border border-[var(--usj-accent)]/30 bg-[var(--usj-accent)]/5 p-4">
      <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-[var(--usj-accent)]">
        {callout.label}
      </p>
      <div className="space-y-2">
        {callout.body.map((paragraph, i) => (
          <p key={i} className="text-sm leading-relaxed text-slate-700">
            {paragraph}
          </p>
        ))}
      </div>
    </div>
  )
}

function CategoryBlockRenderer({ block }: { block: CategoryBlock }) {
  if (block.kind === "p") {
    return <p className="leading-relaxed text-slate-700">{block.text}</p>
  }
  if (block.kind === "ul") {
    return (
      <ul className="list-disc space-y-1.5 pl-6 leading-relaxed text-slate-700">
        {block.items.map((item, i) => (
          <li key={i}>{item}</li>
        ))}
      </ul>
    )
  }
  if (block.kind === "table") {
    return <DataTable table={block.table} />
  }
  return <CalloutBox callout={block.callout} />
}

function CategoryCard({ category }: { category: Category }) {
  return (
    <Card id={category.id} className="scroll-mt-24">
      <CardHeader>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <CardTitle className="text-lg">{category.title}</CardTitle>
          <StatusBadge
            status={category.status}
            label={category.statusLabel}
          />
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {category.blocks.map((block, i) => (
          <CategoryBlockRenderer key={i} block={block} />
        ))}
      </CardContent>
    </Card>
  )
}

export default function CustomsGuide({ doc }: { doc: CustomsDoc }) {
  return (
    <main className="flex flex-col">
      {/* Hero */}
      <section className="border-b border-slate-200 bg-[var(--usj-surface)]">
        <div className="mx-auto max-w-4xl px-4 py-16 text-center md:py-24">
          <p className="mb-3 text-sm font-semibold tracking-wide text-[var(--usj-accent)]">
            {doc.eyebrow}
          </p>
          <h1 className="mb-5 text-3xl leading-tight font-bold text-primary md:text-5xl">
            {doc.title}
          </h1>
          <p className="mx-auto mb-4 max-w-2xl text-base leading-relaxed text-slate-600 md:text-lg">
            {doc.lede}
          </p>
          <p className="text-xs font-medium text-muted-foreground">
            {doc.updatedNote}
          </p>
        </div>
      </section>

      {/* Notice */}
      <section className="mx-auto w-full max-w-4xl px-4 py-10">
        <div className="rounded-lg border border-amber-300/60 bg-amber-50 p-5">
          <div className="flex items-start gap-3">
            <AlertTriangle
              className="mt-0.5 h-5 w-5 shrink-0 text-amber-600"
              aria-hidden="true"
            />
            <div className="space-y-2">
              {doc.noticeParagraphs.map((paragraph, i) => (
                <p key={i} className="text-sm leading-relaxed text-amber-900">
                  {paragraph}
                </p>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Quick reference index */}
      <section className="mx-auto w-full max-w-4xl px-4 pb-10">
        <h2 className="mb-2 text-2xl font-bold text-primary md:text-3xl">
          {doc.indexHeading}
        </h2>
        <p className="mb-6 text-slate-600">{doc.indexIntro}</p>
        <Card>
          <CardContent className="divide-y divide-slate-100 px-0 py-0">
            {doc.indexItems.map((item, i) => (
              <a
                key={i}
                href={`#${item.anchor}`}
                className="flex items-center justify-between gap-4 px-5 py-3.5 transition-colors hover:bg-slate-50"
              >
                <span className="min-w-0">
                  <span className="block text-sm font-medium text-slate-900">
                    {item.name}
                  </span>
                  <span className="block text-xs text-slate-500">
                    {item.note}
                  </span>
                </span>
                <span className="shrink-0">
                  <StatusBadge status={item.status} label={item.statusLabel} />
                </span>
              </a>
            ))}
          </CardContent>
        </Card>
      </section>

      {/* Tax & duty */}
      <section className="border-y border-slate-200 bg-[var(--usj-surface)]">
        <div className="mx-auto w-full max-w-4xl px-4 py-16 md:py-20">
          <h2 className="mb-6 text-2xl font-bold text-primary md:text-3xl">
            {doc.taxHeading}
          </h2>
          <Card className="mb-6 bg-white">
            <CardHeader>
              <CardTitle className="text-lg">{doc.taxFreeHeading}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {doc.taxFreeParagraphs.map((paragraph, i) => (
                <p key={i} className="leading-relaxed text-slate-700">
                  {paragraph}
                </p>
              ))}
            </CardContent>
          </Card>

          <Card className="mb-6 bg-white">
            <CardHeader>
              <CardTitle className="text-lg">{doc.taxOverHeading}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {doc.taxOverParagraphs.map((paragraph, i) => (
                <p key={i} className="leading-relaxed text-slate-700">
                  {paragraph}
                </p>
              ))}
              <DataTable table={doc.taxTable} />
            </CardContent>
          </Card>

          <Card className="mb-6 bg-white">
            <CardHeader>
              <CardTitle className="text-lg">
                {doc.taxDutiedHeading}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="leading-relaxed text-slate-700">
                {doc.taxDutiedIntro}
              </p>
              <ul className="list-disc space-y-1.5 pl-6 leading-relaxed text-slate-700">
                {doc.taxDutiedList.map((item, i) => (
                  <li key={i}>{item}</li>
                ))}
              </ul>
              <p className="text-sm text-slate-500">{doc.taxDutiedNote}</p>
            </CardContent>
          </Card>

          <CalloutBox callout={doc.taxPolicyNotice} />
        </div>
      </section>

      {/* Prohibited items */}
      <section
        id="prohibited"
        className="mx-auto w-full max-w-4xl scroll-mt-24 px-4 py-16 md:py-20"
      >
        <h2 className="mb-2 text-2xl font-bold text-primary md:text-3xl">
          {doc.prohibitedHeading}
        </h2>
        <p className="mb-6 text-slate-600">{doc.prohibitedIntro}</p>
        <Card>
          <CardContent className="pt-6">
            <ul className="list-disc space-y-2 pl-6 leading-relaxed text-slate-700">
              {doc.prohibitedList.map((item, i) => (
                <li key={i}>{item}</li>
              ))}
            </ul>
          </CardContent>
        </Card>
        <CalloutBox callout={doc.prohibitedCallout} />
      </section>

      {/* Quantity limited items */}
      <section
        id="cosmetics"
        className="scroll-mt-24 border-y border-slate-200 bg-[var(--usj-surface)]"
      >
        <div className="mx-auto w-full max-w-4xl px-4 py-16 md:py-20">
          <h2 className="mb-2 text-2xl font-bold text-primary md:text-3xl">
            {doc.quantityHeading}
          </h2>
          <p className="mb-6 text-slate-600">{doc.quantityIntro}</p>
          <Card className="bg-white">
            <CardContent className="pt-6">
              <DataTable table={doc.quantityTable} />
              <p className="text-sm text-slate-500">{doc.quantityNote}</p>
            </CardContent>
          </Card>
          <CalloutBox callout={doc.quantityCallout} />
        </div>
      </section>

      {/* Frequently asked-about categories */}
      <section className="mx-auto w-full max-w-4xl px-4 py-16 md:py-20">
        <h2 className="mb-6 text-2xl font-bold text-primary md:text-3xl">
          {doc.categoriesHeading}
        </h2>
        <div className="space-y-6">
          {doc.categories.map((category) => (
            <CategoryCard key={category.id} category={category} />
          ))}
        </div>
      </section>

      {/* Rules */}
      <section className="border-y border-slate-200 bg-[var(--usj-surface)]">
        <div className="mx-auto w-full max-w-4xl px-4 py-16 md:py-20">
          <h2 className="mb-6 text-2xl font-bold text-primary md:text-3xl">
            {doc.rulesHeading}
          </h2>
          <Card className="bg-white">
            <CardContent className="pt-6">
              <ul className="space-y-3">
                {doc.rulesItems.map((item, i) => (
                  <li key={i} className="flex gap-3">
                    <CheckCircle2
                      className="mt-0.5 h-5 w-5 shrink-0 text-[var(--usj-accent)]"
                      aria-hidden="true"
                    />
                    <span className="leading-relaxed text-slate-700">
                      {item}
                    </span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Footer: disclaimer, official links, contact */}
      <section className="mx-auto w-full max-w-4xl px-4 py-16 md:py-20">
        <div className="grid gap-8 md:grid-cols-2">
          <div>
            <h2 className="mb-3 text-lg font-bold text-primary">
              {doc.footerDisclaimerHeading}
            </h2>
            <ul className="list-disc space-y-2 pl-5 text-sm leading-relaxed text-slate-600">
              {doc.footerDisclaimerItems.map((item, i) => (
                <li key={i}>{item}</li>
              ))}
            </ul>
          </div>
          <div>
            <h2 className="mb-3 text-lg font-bold text-primary">
              {doc.footerOfficialHeading}
            </h2>
            <ul className="space-y-2 text-sm">
              {doc.footerOfficialLinks.map((link, i) => (
                <li key={i}>
                  <a
                    href={link.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary/80 underline-offset-4 hover:text-primary hover:underline"
                  >
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>
        <div className="mt-10 rounded-lg border border-slate-200 bg-[var(--usj-surface)] p-5">
          <h2 className="mb-2 text-base font-bold text-primary">
            {doc.footerContactHeading}
          </h2>
          <p className="text-sm leading-relaxed text-slate-600">
            {doc.footerContactParagraph}
          </p>
        </div>
      </section>
    </main>
  )
}
