"use client"

import useEmblaCarousel from "embla-carousel-react"
import { useCallback, useEffect, useState } from "react"
import clsx from "clsx"
import Link from "next/link"
import { Icon } from "@modules/common/components/my_ui"

export type SlideData = {
  title: string
  text: string
  link: string
  img: string
}

type SliderProps = {
  slides: SlideData[]
  loop?: boolean
  className?: string
  showDots?: boolean
  showArrows?: boolean
}

function SlideItem({ slide }: { slide: SlideData }) {
  return (
    <div
      className="relative flex-[0_0_100%] aspect-[21/9] bg-cover bg-center"
      style={{ backgroundImage: `url(${slide.img})` }}
    >
      {/* Overlay */}
      <div className="absolute inset-0 bg-black/40" />

      {/* Contenu */}
      <div className="relative z-10 flex flex-col justify-end items-center h-full pb-12 text-center">
        <h2 className="text-white text-4xl font-semibold mb-3 leading-tight max-w-2xl">
          {slide.title}
        </h2>
        <p className="text-white/80 text-base mb-6 leading-relaxed max-w-xl">
          {slide.text}
        </p>
        <Link
          href={slide.link}
          className="inline-flex items-center gap-2 w-max
               bg-white text-sky-950 font-medium text-sm
               px-5 py-2.5 rounded-xl
               hover:bg-gray-100 transition-colors duration-150"
        >
          Découvrir
          <Icon name="arrow-right" size={16} />
        </Link>
      </div>
    </div>
  )
}

export function Slider({
                         slides,
                         loop = true,
                         className,
                         showDots = true,
                         showArrows = true,
                       }: SliderProps) {
  const [emblaRef, emblaApi] = useEmblaCarousel({ loop })
  const [current, setCurrent] = useState(0)

  const scrollPrev = useCallback(() => emblaApi?.scrollPrev(), [emblaApi])
  const scrollNext = useCallback(() => emblaApi?.scrollNext(), [emblaApi])

  useEffect(() => {
    if (!emblaApi) return
    const onSelect = () => setCurrent(emblaApi.selectedScrollSnap())
    emblaApi.on("select", onSelect)
    return () => { emblaApi.off("select", onSelect) }
  }, [emblaApi])

  return (
    <div className={clsx("relative w-full", className)}>
      <div className="overflow-hidden" ref={emblaRef}>
        <div className="flex">
          {slides.map((slide, i) => (
            <SlideItem key={i} slide={slide} />
          ))}
        </div>
      </div>

      {showArrows && (
        <>
          <button
            onClick={scrollPrev}
            className="absolute left-4 top-1/2 -translate-y-1/2
                   bg-white/20 hover:bg-white/40 backdrop-blur-sm
                   w-10 h-10 rounded-full transition-colors duration-150
                   flex items-center justify-center"
            aria-label="Slide précédent"
          >
            <Icon name="chevron-left" size={20} color="white" />
          </button>
          <button
            onClick={scrollNext}
            className="absolute right-4 top-1/2 -translate-y-1/2
                   bg-white/20 hover:bg-white/40 backdrop-blur-sm
                   w-10 h-10 rounded-full transition-colors duration-150
                   flex items-center justify-center"
            aria-label="Slide suivant"
          >
            <Icon name="chevron-right" size={20} color="white" />
          </button>
        </>
      )}

      {showDots && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
          {slides.map((_, i) => (
            <button
              key={i}
              onClick={() => emblaApi?.scrollTo(i)}
              className={clsx(
                "h-2 rounded-full transition-all duration-200",
                i === current ? "w-5 bg-white" : "w-2 bg-white/50 hover:bg-white/80"
              )}
              aria-label={`Aller au slide ${i + 1}`}
            />
          ))}
        </div>
      )}
    </div>
  )
}