"use client"

import { useEffect, useState } from "react"

/**
 * Crossfading rotation of hero background photos. Renders every image
 * stacked (so there's no layout shift / missing-image flash on first
 * paint) and fades between them on an interval via opacity only -- no
 * position/size changes, so it stays a drop-in replacement for the
 * previous single <img>.
 */
export default function HeroBackgroundSlideshow({
  images,
  intervalMs = 6000,
}: {
  images: string[]
  intervalMs?: number
}) {
  const [activeIndex, setActiveIndex] = useState(0)

  useEffect(() => {
    if (images.length <= 1) return
    const id = setInterval(() => {
      setActiveIndex((current) => (current + 1) % images.length)
    }, intervalMs)
    return () => clearInterval(id)
  }, [images.length, intervalMs])

  return (
    <>
      {images.map((src, index) => (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          key={src}
          src={src}
          alt=""
          className={`absolute inset-0 h-full w-full object-contain object-right-top transition-opacity duration-1000 ease-in-out ${
            index === activeIndex ? "opacity-100" : "opacity-0"
          }`}
        />
      ))}
    </>
  )
}
