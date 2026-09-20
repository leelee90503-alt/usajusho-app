"use client"

import { useEffect, useState } from "react"
import { Link } from "@/i18n/navigation"
import { Button } from "@/components/ui/button"

type HeroSlide = {
  image: string
  eyebrow: string
  headline: string
  description: string
}

/**
 * Full hero content + background rotator. Background photo and the
 * eyebrow/headline/description text change together (not independently),
 * so each slide reads as one coherent message. CTAs and the trust note
 * stay fixed underneath since they apply regardless of which slide is
 * showing.
 */
export default function HeroSlideshow({
  slides,
  ctaPrimaryText,
  ctaSecondaryText,
  trustNote,
  intervalMs = 6000,
}: {
  slides: HeroSlide[]
  ctaPrimaryText: string
  ctaSecondaryText: string
  trustNote: string
  intervalMs?: number
}) {
  const [activeIndex, setActiveIndex] = useState(0)

  useEffect(() => {
    if (slides.length <= 1) return
    const id = setInterval(() => {
      setActiveIndex((current) => (current + 1) % slides.length)
    }, intervalMs)
    return () => clearInterval(id)
  }, [slides.length, intervalMs])

  return (
    <div className="relative isolate overflow-hidden rounded-2xl mx-auto max-w-6xl px-4 py-8 md:py-14 mt-4 md:mt-6">
      <div className="absolute inset-0 -z-10 bg-white">
        {slides.map((slide, index) => (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            key={slide.image}
            src={slide.image}
            alt=""
            className={`absolute inset-0 h-full w-full object-contain object-right-top transition-opacity duration-1000 ease-in-out ${
              index === activeIndex ? "opacity-100" : "opacity-0"
            }`}
          />
        ))}
        {/* Bright wash (left -> right) so the photo's warm, natural light
            reads through instead of being covered by the brand navy. */}
        <div className="absolute inset-0 bg-gradient-to-r from-white from-0% via-white/75 via-50% to-white/5 to-100%" />
      </div>

      <div className="max-w-xl relative min-h-[220px] md:min-h-[260px]">
        {slides.map((slide, index) => (
          <div
            key={slide.image}
            className={`transition-opacity duration-1000 ease-in-out ${
              index === activeIndex
                ? "opacity-100 relative"
                : "opacity-0 absolute inset-0 pointer-events-none"
            }`}
          >
            <p className="text-[var(--usj-accent)] font-semibold text-sm mb-3 tracking-wide">
              {slide.eyebrow}
            </p>
            <h1 className="text-3xl md:text-5xl font-bold text-[var(--usj-text)] leading-tight mb-5">
              {slide.headline}
            </h1>
            <p className="text-slate-600 text-base md:text-lg mb-8 max-w-md leading-relaxed">
              {slide.description}
            </p>
          </div>
        ))}
        <div className="flex flex-wrap gap-3 mb-8">
          <Button
            asChild
            size="lg"
            className="h-auto px-6 py-3 text-sm font-semibold bg-[var(--usj-accent)] text-white hover:bg-[var(--usj-accent)]/90"
          >
            <Link href="/signup">{ctaPrimaryText}</Link>
          </Button>
          <Button
            asChild
            variant="outline"
            size="lg"
            className="h-auto px-6 py-3 text-sm font-semibold bg-transparent border-[var(--usj-text)]/30 text-[var(--usj-text)] hover:bg-black/5"
          >
            <a href="#calculator">{ctaSecondaryText}</a>
          </Button>
        </div>
        <p className="text-xs text-slate-500">{trustNote}</p>
      </div>

      {slides.length > 1 && (
        <div className="flex gap-1.5 mt-2">
          {slides.map((slide, index) => (
            <span
              key={slide.image}
              className={`h-1.5 rounded-full transition-all duration-300 ${
                index === activeIndex ? "w-6 bg-[var(--usj-accent)]" : "w-1.5 bg-slate-300"
              }`}
            />
          ))}
        </div>
      )}
    </div>
  )
}
