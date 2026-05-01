import Image from "next/image"
import Link from "next/link"
import type { ArticlePreview } from "@lib/blog/types"

type BlogCardProps = ArticlePreview & {
  featured?: boolean
  horizontal?: boolean
}

export default function BlogCard({
  slug,
  meta,
  featured = false,
  horizontal = false,
}: BlogCardProps) {
  const { title, excerpt, cover, category, date, readTime, author } = meta

  // ── Featured (hero) ────────────────────────────────────────────────────────
  if (featured) {
    return (
      <Link href={`/blog/${slug}`} className="group block relative overflow-hidden">
        <div className="relative h-[480px] w-full overflow-hidden">
          <Image
            src={cover}
            alt={title}
            fill
            priority
            sizes="(max-width: 1024px) 100vw, 66vw"
            className="object-cover transition-transform duration-700 group-hover:scale-105"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/25 to-transparent" />
        </div>
        <div className="absolute bottom-0 left-0 right-0 p-8 md:p-10">
          <span className="inline-block text-[10px] tracking-[0.3em] uppercase text-white/60 mb-3">
            {category}
          </span>
          <h2 className="text-2xl md:text-3xl text-white font-normal leading-snug mb-3 max-w-xl group-hover:text-white/80 transition-colors">
            {title}
          </h2>
          <p className="text-sm text-white/60 leading-relaxed mb-5 max-w-lg line-clamp-2">
            {excerpt}
          </p>
          <div className="flex items-center gap-3 text-white/40 text-xs">
            <span>{author}</span>
            <span>·</span>
            <span>{date}</span>
            <span>·</span>
            <span>{readTime}</span>
          </div>
        </div>
      </Link>
    )
  }

  // ── Horizontal (sidebar) ───────────────────────────────────────────────────
  if (horizontal) {
    return (
      <Link
        href={`/blog/${slug}`}
        className="group flex gap-4 py-4 border-b border-ui-border-base hover:border-ui-border-strong transition-colors last:border-0"
      >
        <div className="relative w-24 h-16 flex-shrink-0 overflow-hidden">
          <Image
            src={cover}
            alt={title}
            fill
            sizes="96px"
            className="object-cover transition-transform duration-500 group-hover:scale-110"
          />
        </div>
        <div className="flex flex-col justify-between min-w-0">
          <div>
            <span className="text-[10px] tracking-[0.2em] uppercase text-ui-fg-muted">
              {category}
            </span>
            <h3 className="text-sm text-ui-fg-base font-normal leading-snug mt-0.5 group-hover:text-ui-fg-interactive transition-colors line-clamp-2">
              {title}
            </h3>
          </div>
          <p className="text-[11px] text-ui-fg-muted mt-1">{date} · {readTime}</p>
        </div>
      </Link>
    )
  }

  // ── Standard (grille) ─────────────────────────────────────────────────────
  return (
    <Link href={`/blog/${slug}`} className="group flex flex-col">
      <div className="relative aspect-[16/10] overflow-hidden mb-4">
        <Image
          src={cover}
          alt={title}
          fill
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
          className="object-cover transition-transform duration-700 group-hover:scale-105"
        />
        <span className="absolute top-3 left-3 text-[10px] tracking-[0.2em] uppercase bg-white text-ui-fg-base px-2 py-1">
          {category}
        </span>
      </div>
      <div className="flex flex-col flex-1">
        <h3 className="text-base text-ui-fg-base font-normal leading-snug mb-2 group-hover:text-ui-fg-interactive transition-colors line-clamp-2">
          {title}
        </h3>
        <p className="text-sm text-ui-fg-subtle leading-relaxed mb-4 flex-1 line-clamp-3">
          {excerpt}
        </p>
        <div className="flex items-center justify-between text-xs text-ui-fg-muted border-t border-ui-border-base pt-3 mt-auto">
          <span>{author}</span>
          <span>{readTime}</span>
        </div>
      </div>
    </Link>
  )
}
