import LocalizedClientLink from "@modules/common/components/localized-client-link"
import BlockRenderer from "@modules/blog/components/blocks/BlockRenderer"
import type { BlogPost } from "@lib/blog/types"

/**
 * Gabarit d'un contenu rédigé dans le backoffice.
 *
 * Partagé par /blog/[slug] et par les pages autonomes (/[pagePath]) : ces
 * dernières masquent en général fil d'ariane, méta et pied de page via les
 * options de l'article, ne gardant que le corps.
 */
export default function ArticleTemplate({ post }: { post: BlogPost }) {
  const firstBlock   = post.blocks[0]
  const hasBanner    = firstBlock?.type === "banner"
  const bannerBlocks = hasBanner ? post.blocks.slice(0, 1) : []
  const bodyBlocks   = hasBanner ? post.blocks.slice(1)   : post.blocks

  /**
   * Le H1 de la page vient de la bannière quand elle porte un titre — sinon il
   * est rendu ici à partir de `post.title`.
   *
   * Sans ce repli, un article sans bannière (ou dont la bannière n'a pas de
   * titre saisi) ne contenait AUCUN <h1> : c'était le cas des trois articles
   * en ligne. Un moteur n'avait alors rien pour identifier le sujet de la page
   * en dehors de la balise <title>.
   *
   * Combiné à TitleBlock, qui ne rend plus jamais de <h1>, cela garantit
   * exactement un H1 par page, quel que soit le contenu saisi en backoffice.
   */
  const bannerProvidesH1 =
    hasBanner && firstBlock.type === "banner" && Boolean(firstBlock.title)

  return (
    <div className="bg-ui-bg-base min-h-screen">

      {/* ── Breadcrumb / retour ───────────────────────────────────────── */}
      {/* Non sticky : la navbar globale est déjà `sticky top-0 z-50`. Deux
          barres collées en haut se chevaucheraient au scroll. */}
      {!post.hide_breadcrumb && (
        <nav className="bg-ui-bg-base/90 backdrop-blur-sm border-b border-ui-border-base">
          <div className="content-container py-3 flex items-center justify-between">
            <LocalizedClientLink href="/blog" className="text-xs tracking-widest uppercase text-ui-fg-muted hover:text-ui-fg-interactive transition-colors">
              ← Blog
            </LocalizedClientLink>
            <span className="text-[10px] tracking-[0.3em] uppercase text-ui-fg-muted">
              {post.category}
            </span>
          </div>
        </nav>
      )}

      {/* ── Banner ───────────────────────────────────────────────────── */}
      {bannerBlocks.length > 0 && <BlockRenderer blocks={bannerBlocks} />}

      {/* ── H1 de repli ──────────────────────────────────────────────── */}
      {!bannerProvidesH1 && (
        <div className="content-container max-w-5xl pt-10 pb-2">
          <h1 className="text-3xl md:text-4xl text-ui-fg-base font-normal leading-tight">
            {post.title}
          </h1>
        </div>
      )}

      {/* ── Méta ─────────────────────────────────────────────────────── */}
      {!post.hide_meta && (
        <div className="content-container max-w-5xl mb-6">
          <div className="flex items-center gap-3 text-xs text-ui-fg-muted flex-wrap">
            <span className="text-ui-fg-interactive">{post.category}</span>
            <span>·</span>
            <span>{post.date}</span>
            <span>·</span>
            <span>{post.read_time} de lecture</span>
          </div>
          <div className="mt-4 flex items-center gap-3">
            <div className="w-7 h-7 rounded-full bg-ui-bg-subtle border border-ui-border-base flex items-center justify-center text-xs font-medium text-ui-fg-base">
              {post.author?.charAt(0) ?? "?"}
            </div>
            <span className="text-sm text-ui-fg-subtle">{post.author}</span>
          </div>
          <div className="h-px bg-ui-border-base mt-6" />
        </div>
      )}

      {/* ── Corps ────────────────────────────────────────────────────── */}
      {/* Sans le bloc méta, le contenu collerait au banner (ou à la navbar) :
          on rétablit une respiration en haut. */}
      <article className={`content-container max-w-5xl pb-24 ${post.hide_meta ? "pt-10" : ""}`}>
        <BlockRenderer blocks={bodyBlocks} />
      </article>

      {/* ── Footer ───────────────────────────────────────────────────── */}
      {!post.hide_footer && (
        <div className="border-t border-ui-border-base bg-ui-bg-subtle">
          <div className="content-container max-w-5xl py-10 flex items-center justify-between">
            <div>
              <p className="text-xs text-ui-fg-muted uppercase tracking-widest mb-1">Écrit par</p>
              <p className="text-ui-fg-base">{post.author}</p>
            </div>
            <LocalizedClientLink href="/blog" className="text-sm text-ui-fg-interactive hover:text-ui-fg-interactive-hover transition-colors">
              ← Retour au blog
            </LocalizedClientLink>
          </div>
        </div>
      )}

    </div>
  )
}
