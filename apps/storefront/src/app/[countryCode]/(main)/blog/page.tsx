import { getAllArticles, getAllCategories } from "@lib/blog"
import BlogCard from "@modules/blog/components/BlogCard"
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Blog",
  description: "Articles & récits",
}

// ISR : revalide toutes les 60s
export const revalidate = 60

export default async function BlogPage() {
  const [articles, categories] = await Promise.all([
    getAllArticles(),
    getAllCategories(),
  ])

  const featured     = articles.find((a) => a.featured) ?? articles[0]
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
        <div className="content-container py-8 flex items-end justify-between flex-wrap gap-4">
          <div>
            <p className="text-ui-fg-muted text-xs tracking-[0.3em] uppercase mb-1">Revue</p>
            <h1 className="text-3xl text-ui-fg-base font-normal">Blog</h1>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            {categories.map((cat) => (
              <span key={cat} className="text-[10px] tracking-[0.2em] uppercase text-ui-fg-muted border border-ui-border-base px-3 py-1.5">
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
              <BlogCard slug={featured.slug} post={featured} featured />
            </div>
            {sideArticles.length > 0 && (
              <aside>
                <p className="text-[10px] tracking-[0.3em] uppercase text-ui-fg-muted mb-3">À lire aussi</p>
                <div className="border-t border-ui-border-base">
                  {sideArticles.map((a) => (
                    <BlogCard key={a.slug} slug={a.slug} post={a} horizontal />
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
                <BlogCard key={a.slug} slug={a.slug} post={a} />
              ))}
            </div>
          </>
        )}

        {articles.length === 0 && (
          <p className="text-center text-ui-fg-muted py-32 text-sm">
            Aucun article publié pour l'instant.
          </p>
        )}
      </div>
    </div>
  )
}
