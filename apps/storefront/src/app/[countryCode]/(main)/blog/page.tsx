import { getAllArticles, getAllCategories } from "@lib/blog"
import BlogCard from "@modules/blog/components/BlogCard"
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Blog",
  description: "Articles & récits",
}

export default function BlogPage() {
  const articles = getAllArticles()
  const categories = getAllCategories()

  const featured = articles.find((a) => a.meta.featured) ?? articles[0]
  const sideArticles = articles.filter((a) => a.slug !== featured?.slug).slice(0, 3)
  const gridArticles = articles.filter(
    (a) =>
      a.slug !== featured?.slug &&
      !sideArticles.find((s) => s.slug === a.slug)
  )

  return (
    <div className="bg-ui-bg-base min-h-screen">

      {/* ── Header ─────────────────────────────────────────────────────── */}
      <div className="border-b border-ui-border-base bg-ui-bg-base">
        <div className="content-container py-8 flex items-end justify-between">
          <div>
            <p className="text-ui-fg-muted text-xs tracking-[0.3em] uppercase mb-1">
              Revue
            </p>
            <h1 className="text-3xl text-ui-fg-base font-normal">Blog</h1>
          </div>
          {/* Filtres catégories */}
          <div className="flex items-center gap-2 flex-wrap justify-end">
            {categories.map((cat) => (
              <span
                key={cat}
                className="text-[10px] tracking-[0.2em] uppercase text-ui-fg-muted border border-ui-border-base px-3 py-1.5"
              >
                {cat}
              </span>
            ))}
          </div>
        </div>
      </div>

      <div className="content-container py-12">

        {/* ── Hero ───────────────────────────────────────────────────────── */}
        {featured && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-16">
            <div className="lg:col-span-2">
              <BlogCard slug={featured.slug} meta={featured.meta} featured />
            </div>
            {sideArticles.length > 0 && (
              <aside>
                <p className="text-[10px] tracking-[0.3em] uppercase text-ui-fg-muted mb-3">
                  À lire aussi
                </p>
                <div className="border-t border-ui-border-base">
                  {sideArticles.map((a) => (
                    <BlogCard key={a.slug} slug={a.slug} meta={a.meta} horizontal />
                  ))}
                </div>
              </aside>
            )}
          </div>
        )}

        {/* ── Grille ─────────────────────────────────────────────────────── */}
        {gridArticles.length > 0 && (
          <>
            <div className="flex items-center gap-4 mb-10">
              <span className="text-[10px] tracking-[0.3em] uppercase text-ui-fg-muted">
                Tous les articles
              </span>
              <div className="flex-1 h-px bg-ui-border-base" />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-14">
              {gridArticles.map((a) => (
                <BlogCard key={a.slug} slug={a.slug} meta={a.meta} />
              ))}
            </div>
          </>
        )}

      </div>
    </div>
  )
}
