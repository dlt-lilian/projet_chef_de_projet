import Link from "next/link"
import BlogCard from "./BlogCard"
import { getLatestArticles } from "@lib/blog"
import type { ArticlePreview } from "@lib/blog/types"

type ArticleGridProps = {
  /** Nombre d'articles à afficher (défaut: 3) */
  count?: number
  /** Articles pré-chargés (optionnel, sinon chargés automatiquement) */
  articles?: ArticlePreview[]
  /** Titre de la section */
  heading?: string
}

/**
 * ArticleGrid
 *
 * Section blog à intégrer sur la homepage du storefront Medusa.
 *
 * Usage dans src/app/[countryCode]/(main)/page.tsx :
 *
 *   import ArticleGrid from "@modules/blog/components/ArticleGrid"
 *
 *   // Dans le JSX :
 *   <ArticleGrid count={3} heading="Du côté du blog" />
 */
export default function ArticleGrid({
  count = 3,
  articles,
  heading = "Le Blog",
}: ArticleGridProps) {
  const items = articles ?? getLatestArticles(count)

  if (!items.length) return null

  return (
    <section className="content-container py-16 md:py-24">
      {/* En-tête section */}
      <div className="flex items-end justify-between mb-10">
        <div>
          <p className="text-ui-fg-muted text-xs tracking-[0.3em] uppercase mb-1">
            Articles récents
          </p>
          <h2 className="text-2xl md:text-3xl text-ui-fg-base font-normal">
            {heading}
          </h2>
        </div>
        <Link
          href="/blog"
          className="text-sm text-ui-fg-interactive hover:text-ui-fg-interactive-hover transition-colors hidden md:block"
        >
          Tous les articles →
        </Link>
      </div>

      {/* Grille */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-12">
        {items.map((article) => (
          <BlogCard key={article.slug} slug={article.slug} meta={article.meta} />
        ))}
      </div>

      {/* Lien mobile */}
      <div className="mt-10 text-center md:hidden">
        <Link
          href="/blog"
          className="text-sm text-ui-fg-interactive hover:text-ui-fg-interactive-hover transition-colors"
        >
          Tous les articles →
        </Link>
      </div>
    </section>
  )
}
