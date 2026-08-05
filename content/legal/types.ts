export type LegalBlock =
  | { kind: "p"; lead?: string; text?: string }
  | { kind: "ul"; items: string[] }
  | { kind: "ol-alpha"; items: string[] }

export type LegalSection = {
  heading: string
  blocks: LegalBlock[]
}

export type LegalDoc = {
  title: string
  effectiveDateLabel: string
  intro: string[]
  sections: LegalSection[]
}
