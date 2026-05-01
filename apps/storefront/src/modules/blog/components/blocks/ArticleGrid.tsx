import Link from "next/link"
import BlogCard from "./BlogCard"
import { getLatestArticles } from "@lib/blog"
import type { BlogPostPreview } from "@lib/blog/types"

type ArticleGridProps = {
  count?: number
  posts?: BlogPostPreview[]
  heading?: string
}

/**
 * ArticleGrid — section blog pour la homepage.
 *
 * Usage dans src/app/[countryCode]/(main)/page.tsx :
 *
 *   import ArticleGrid from "@modules/blog/components/ArticleGrid"
 *   <ArticleGrid count={3} heading="Du côté du blog" />
 */
export default async function ArticleGrid({
  count = 3,
  posts,
  heading = "Le Blog",
}: ArticleGridProps) {
  const items = posts ?? (await getLatestArticles(count))
  if (!items.length) return null

  return (
    <section className="content-container py-16 md:py-24">
      <div className="flex items-end justify-between mb-10">
        <div>
          <p className="text-ui-fg-muted text-xs tracking-[0.3em] uppercase mb-1">
            Articles récents
          </p>
          <h2 className="text-2xl md:text-3xl text-ui-fg-base font-normal">{heading}</h2>
        </div>
        <Link href="/blog" className="text-sm text-ui-fg-interactive hover:text-ui-fg-interactive-hover transition-colors hidden md:block">
          Tous les articles →
        </Link>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-12">
        {items.map((post) => (
          <BlogCard key={post.slug} slug={post.slug} post={post} />
        ))}
      </div>

      <div className="mt-10 text-center md:hidden">
        <Link href="/blog" className="text-sm text-ui-fg-interactive hover:text-ui-fg-interactive-hover transition-colors">
          Tous les articles →
        </Link>
      </div>
    </section>
  )
}
