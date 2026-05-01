import Image from "next/image"
import type { BannerBlock as TBannerBlock } from "@lib/blog/types"

export default function BannerBlock({ img, alt, title, subtitle }: TBannerBlock) {
  return (
    <div className="relative w-full h-[60vh] min-h-[420px] overflow-hidden mb-12">
      <Image src={img} alt={alt} fill priority sizes="100vw" className="object-cover" />
      <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/25 to-transparent" />
      {(title || subtitle) && (
        <div className="absolute bottom-0 left-0 right-0 px-8 pb-12 md:px-16">
          {subtitle && (
            <p className="text-xs tracking-[0.3em] uppercase text-ui-fg-on-inverted/70 mb-2 font-normal">
              {subtitle}
            </p>
          )}
          {title && (
            <h1 className="text-4xl md:text-6xl text-ui-fg-on-inverted leading-tight max-w-3xl font-normal">
              {title}
            </h1>
          )}
        </div>
      )}
    </div>
  )
}
