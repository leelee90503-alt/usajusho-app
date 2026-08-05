import type { LegalDoc } from "@/content/legal/types"

export default function LegalDocument({ doc }: { doc: LegalDoc }) {
  return (
    <main className="flex flex-col">
      <section className="mx-auto max-w-3xl px-4 py-16 md:py-20 w-full">
        <h1 className="text-3xl md:text-4xl font-bold text-[var(--usj-primary)] mb-2">
          {doc.title}
        </h1>
        <p className="text-sm font-semibold text-slate-500 mb-8">
          {doc.effectiveDateLabel}
        </p>
        {doc.intro.map((paragraph, index) => (
          <p key={index} className="text-slate-700 leading-relaxed mb-6">
            {paragraph}
          </p>
        ))}
        <div className="space-y-8">
          {doc.sections.map((section, sectionIndex) => (
            <section key={sectionIndex}>
              <h2 className="text-xl md:text-2xl font-bold text-[var(--usj-primary)] mb-3">
                {section.heading}
              </h2>
              <div className="space-y-3">
                {section.blocks.map((block, blockIndex) => {
                  if (block.kind === "p") {
                    return (
                      <p key={blockIndex} className="text-slate-700 leading-relaxed">
                        {block.lead ? (
                          <strong className="font-semibold">{block.lead}</strong>
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
                        className="list-disc pl-6 space-y-1 text-slate-700 leading-relaxed"
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
                      className="list-[lower-alpha] pl-6 space-y-1 text-slate-700 leading-relaxed"
                    >
                      {block.items.map((item, itemIndex) => (
                        <li key={itemIndex}>{item}</li>
                      ))}
                    </ol>
                  )
                })}
              </div>
            </section>
          ))}
        </div>
      </section>
    </main>
  )
}
