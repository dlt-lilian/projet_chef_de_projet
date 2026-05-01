import Image from "next/image"
import type { ImgBlock as TImgBlock } from "@lib/blog/types"

export default function ImgBlock({ src, alt, caption, fullWidth }: TImgBlock) {
  return (
    <figure className={["my-10 group", fullWidth ? "-mx-4 md:-mx-12 lg:-mx-32" : ""].filter(Boolean).join(" ")}>
      <div className="relative overflow-hidden">
        <Image
          src={src}
          alt={alt}
          width={1600}
          height={900}
          sizes={fullWidth ? "100vw" : "(max-width: 768px) 100vw, 800px"}
          className="w-full h-auto object-cover transition-transform duration-700 group-hover:scale-[1.02]"
        />
      </div>
      {caption && (
        <figcaption className="mt-3 text-xs text-ui-fg-muted tracking-wide text-center">
          {caption}
        </figcaption>
      )}
    </figure>
  )
}
