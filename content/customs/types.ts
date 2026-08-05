export type ChipStatus = "go" | "warn" | "stop"

export type TableBlock = {
  caption?: string
  head: string[]
  rows: string[][]
}

export type Callout = {
  label: string
  body: string[]
}

export type IndexItem = {
  name: string
  note: string
  status: ChipStatus
  statusLabel: string
  anchor: string
}

export type CategoryBlock =
  | { kind: "p"; text: string }
  | { kind: "ul"; items: string[] }
  | { kind: "table"; table: TableBlock }
  | { kind: "callout"; callout: Callout }

export type Category = {
  id: string
  title: string
  status: ChipStatus
  statusLabel: string
  blocks: CategoryBlock[]
}

export type CustomsDoc = {
  eyebrow: string
  title: string
  lede: string
  updatedNote: string
  noticeParagraphs: string[]
  indexHeading: string
  indexIntro: string
  indexItems: IndexItem[]
  taxHeading: string
  taxFreeHeading: string
  taxFreeParagraphs: string[]
  taxOverHeading: string
  taxOverParagraphs: string[]
  taxTable: TableBlock
  taxDutiedHeading: string
  taxDutiedIntro: string
  taxDutiedList: string[]
  taxDutiedNote: string
  taxPolicyNotice: Callout
  prohibitedHeading: string
  prohibitedIntro: string
  prohibitedList: string[]
  prohibitedCallout: Callout
  quantityHeading: string
  quantityIntro: string
  quantityTable: TableBlock
  quantityNote: string
  quantityCallout: Callout
  categoriesHeading: string
  categories: Category[]
  rulesHeading: string
  rulesItems: string[]
  footerDisclaimerHeading: string
  footerDisclaimerItems: string[]
  footerOfficialHeading: string
  footerOfficialLinks: { label: string; href: string }[]
  footerContactHeading: string
  footerContactParagraph: string
  footerContactLine: string
}
