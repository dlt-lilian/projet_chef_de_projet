import Image from "next/image"
import Link from "next/link"
import type { BlogPostPreview } from "@lib/blog/types"

type BlogCardProps = {
  slug: string
  post: BlogPostPreview
  featured?: boolean
  horizontal?: boolean
}

export default function BlogCard({
  slug,
  post,
  featured = false,
  horizontal = false,
}: BlogCardProps) {
  const { title, excerpt, cover, category, date, read_time, author } = post

  if (featured) {
    return (
      <Link href={`/blog/${slug}`} className="group block relative overflow-hidden rounded-2xl">
        <div className="relative h-[480px] w-full overflow-hidden">
          {cover && (
            <Image
              src={cover}
              alt={title}
              fill
              priority
              sizes="(max-width: 1024px) 100vw, 66vw"
              className="object-cover transition-transform duration-700 group-hover:scale-105"
            />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/25 to-transparent" />
        </div>
        <div className="absolute bottom-0 left-0 right-0 p-8 md:p-10">
          <span className="inline-block text-[10px] tracking-[0.3em] uppercase text-white/70 mb-3">
            {category}
          </span>
          <h2 className="text-2xl md:text-3xl text-white font-semibold leading-snug mb-3 max-w-xl group-hover:text-white/80 transition-colors">
            {title}
          </h2>
          <p className="text-sm text-white/70 leading-relaxed mb-5 max-w-lg line-clamp-2">
            {excerpt}
          </p>
          <div className="flex items-center gap-3 text-white/50 text-xs">
            <span>{author}</span>
            <span>·</span>
            <span>{date}</span>
            <span>·</span>
            <span>{read_time}</span>
          </div>
        </div>
      </Link>
    )
  }

  if (horizontal) {
    return (
      <Link
        href={`/blog/${slug}`}
        className="group flex gap-4 py-4 border-b border-grey-20 hover:border-grey-30 transition-colors last:border-0"
      >
        <div className="relative w-24 h-16 flex-shrink-0 overflow-hidden bg-grey-20 rounded-lg">
          {cover && (
            <Image
              src={cover}
              alt={title}
              fill
              sizes="96px"
              className="object-cover transition-transform duration-500 group-hover:scale-110"
            />
          )}
        </div>
        <div className="flex flex-col justify-between min-w-0">
          <div>
            <span className="text-[10px] tracking-[0.2em] uppercase text-gray-500">
              {category}
            </span>
            <h3 className="text-sm text-grey-90 font-medium leading-snug mt-0.5 group-hover:text-primary transition-colors line-clamp-2">
              {title}
            </h3>
          </div>
          <p className="text-[11px] text-gray-500 mt-1">
            {date} · {read_time}
          </p>
        </div>
      </Link>
    )
  }

  return (
    <Link href={`/blog/${slug}`} className="group flex flex-col">
      <div className="relative aspect-[16/10] overflow-hidden mb-4 bg-grey-20 rounded-2xl">
        {cover && (
          <Image
            src={cover}
            alt={title}
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            className="object-cover transition-transform duration-700 group-hover:scale-105"
          />
        )}
      </div>
      <div className="flex flex-col flex-1">
        <h3 className="text-base md:text-lg text-grey-90 font-medium leading-snug mb-2 group-hover:text-primary transition-colors line-clamp-2">
          {title}
        </h3>
        <p className="text-sm text-gray-600 leading-relaxed mb-4 flex-1 line-clamp-3">
          {excerpt}
        </p>
        <div className="flex items-center gap-3 text-xs text-gray-500 mt-auto">
          <span>{date}</span>
          <span className="inline-block bg-grey-20 text-grey-90 text-[10px] uppercase tracking-wider px-2 py-1 rounded-full">
            {category}
          </span>
        </div>
      </div>
    </Link>
  )
}
