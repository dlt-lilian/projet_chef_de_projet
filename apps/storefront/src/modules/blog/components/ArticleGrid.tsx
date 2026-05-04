import Link from "next/link"
import BlogCard from "./BlogCard"
import { getLatestArticles } from "@lib/blog"
import type { BlogPostPreview } from "@lib/blog/types"

type ArticleGridProps = {
  count?: number
  articles?: BlogPostPreview[]
  heading?: string
}

export default async function ArticleGrid({
  count = 3,
  articles,
  heading = "Le Blog",
}: ArticleGridProps) {
  const items = articles ?? (await getLatestArticles(count))

  if (!items.length) return null

  return (
    <section className="content-container py-12 md:py-16">
      <div className="flex items-end justify-between mb-8">
        <div>
          <p className="text-gray-500 text-xs tracking-[0.3em] uppercase mb-1">
            Articles récents
          </p>
          <h2 className="text-2xl md:text-3xl text-grey-90 font-semibold">
            {heading}
          </h2>
        </div>
        <Link
          href="/blog"
          className="text-sm text-primary hover:underline transition-colors hidden md:block"
        >
          Tous les articles →
        </Link>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-12">
        {items.map((article) => (
          <BlogCard key={article.slug} slug={article.slug} post={article} />
        ))}
      </div>

      <div className="mt-10 text-center md:hidden">
        <Link
          href="/blog"
          className="text-sm text-primary hover:underline transition-colors"
        >
          Tous les articles →
        </Link>
      </div>
    </section>
  )
}
