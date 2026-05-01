import Image from "next/image"
import type { DoubleImgBlock as TDoubleImgBlock } from "@lib/blog/types"

export default function DoubleImgBlock({ images }: TDoubleImgBlock) {
  if (!images || images.length < 2) return null
  const [left, right] = images

  return (
    <figure className="my-10 grid grid-cols-1 md:grid-cols-2 gap-4">
      {[left, right].map((img, i) => (
        <div key={i} className="group">
          <div className="relative overflow-hidden">
            <Image
              src={img.src}
              alt={img.alt}
              width={800}
              height={600}
              sizes="(max-width: 768px) 100vw, 50vw"
              className="w-full aspect-[4/3] object-cover transition-transform duration-700 group-hover:scale-[1.03]"
            />
          </div>
          {img.caption && (
            <figcaption className="mt-2 text-xs text-ui-fg-muted tracking-wide text-center">
              {img.caption}
            </figcaption>
          )}
        </div>
      ))}
    </figure>
  )
}
