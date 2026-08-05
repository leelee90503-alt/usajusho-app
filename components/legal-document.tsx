import type { LegalDoc } from "@/content/legal/types"
import { Card, CardContent } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"

export default function LegalDocument({ doc }: { doc: LegalDoc }) {
  return (
    <main className="flex flex-col">
      <section className="mx-auto w-full max-w-3xl px-4 py-16 md:py-20">
        <header className="mb-10">
          <h1 className="text-3xl font-bold tracking-tight text-primary md:text-4xl">
            {doc.title}
          </h1>
          <p className="mt-2 text-sm font-medium text-muted-foreground">
            {doc.effectiveDateLabel}
          </p>
        </header>

        {doc.sections.length > 1 ? (
          <nav
            aria-label="Table of contents"
            className="mb-10 rounded-lg border border-border bg-surface/60 p-5"
          >
            <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              On this page
            </p>
            <ol className="grid gap-x-6 gap-y-1.5 sm:grid-cols-2">
              {doc.sections.map((section, index) => (
                <li key={index}>
                  <a
                    href={`#section-${index}`}
                    className="text-sm text-primary/80 underline-offset-4 hover:text-primary hover:underline"
                  >
                    {section.heading}
                  </a>
                </li>
              ))}
            </ol>
          </nav>
        ) : null}

        <Card className="ring-border/60">
          <CardContent className="px-6 py-8 md:px-10 md:py-12">
            <div className="space-y-6">
              {doc.intro.map((paragraph, index) => (
                <p key={index} className="leading-relaxed text-slate-700">
                  {paragraph}
                </p>
              ))}
            </div>

            <div className="mt-2">
              {doc.sections.map((section, sectionIndex) => (
                <div key={sectionIndex}>
                  {sectionIndex > 0 ? <Separator className="mb-8" /> : null}
                  <section id={`section-${sectionIndex}`} className="scroll-mt-24 pb-8 last:pb-0">
                    <h2 className="mb-4 text-xl font-bold text-primary md:text-2xl">
                      {section.heading}
                    </h2>
                    <div className="space-y-4">
                      {section.blocks.map((block, blockIndex) => {
                        if (block.kind === "p") {
                          return (
                            <p key={blockIndex} className="leading-relaxed text-slate-700">
                              {block.lead ? (
                                <strong className="font-semibold text-slate-900">
                                  {block.lead}
                                </strong>
                              ) : null}
                              {block.lead && block.text ? " " : null}
                              {block.text}
                            </p>
                          )
                        }
                        if (block.kind === "ul") {
                          return (
                            <ul
                              key={blockIndex}
                              className="list-disc space-y-1.5 pl-6 leading-relaxed text-slate-700"
                            >
                              {block.items.map((item, itemIndex) => (
                                <li key={itemIndex}>{item}</li>
                              ))}
                            </ul>
                          )
                        }
                        return (
                          <ol
                            key={blockIndex}
                            className="list-[lower-alpha] space-y-1.5 pl-6 leading-relaxed text-slate-700"
                          >
                            {block.items.map((item, itemIndex) => (
                              <li key={itemIndex}>{item}</li>
                            ))}
                          </ol>
                        )
                      })}
                    </div>
                  </section>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </section>
    </main>
  )
}
