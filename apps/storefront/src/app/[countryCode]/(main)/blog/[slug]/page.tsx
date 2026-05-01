import { notFound } from "next/navigation"
import Link from "next/link"
import { getAllSlugs, getArticleBySlug } from "@lib/blog"
import BlockRenderer from "@modules/blog/components/blocks/BlockRenderer"
import type { Metadata } from "next"

type Props = { params: { slug: string; countryCode: string } }

export const revalidate = 60

export async function generateStaticParams() {
  return getAllSlugs()
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const post = await getArticleBySlug(params.slug)
  if (!post) return {}
  return {
    title: post.title,
    description: post.excerpt,
    openGraph: {
      title: post.title,
      description: post.excerpt,
      images: post.cover ? [{ url: post.cover }] : [],
    },
  }
}

export default async function BlogArticlePage({ params }: Props) {
  const post = await getArticleBySlug(params.slug)
  if (!post) notFound()

  const hasBanner    = post.blocks[0]?.type === "banner"
  const bannerBlocks = hasBanner ? post.blocks.slice(0, 1) : []
  const bodyBlocks   = hasBanner ? post.blocks.slice(1)   : post.blocks

  return (
    <div className="bg-ui-bg-base min-h-screen">

      {/* ── Breadcrumb / retour ───────────────────────────────────────── */}
      <nav className="sticky top-0 z-50 bg-ui-bg-base/90 backdrop-blur-sm border-b border-ui-border-base">
        <div className="content-container py-3 flex items-center justify-between">
          <Link href="/blog" className="text-xs tracking-widest uppercase text-ui-fg-muted hover:text-ui-fg-interactive transition-colors">
            ← Blog
          </Link>
          <span className="text-[10px] tracking-[0.3em] uppercase text-ui-fg-muted">
            {post.category}
          </span>
        </div>
      </nav>

      {/* ── Banner ───────────────────────────────────────────────────── */}
      {bannerBlocks.length > 0 && <BlockRenderer blocks={bannerBlocks} />}

      {/* ── Méta ─────────────────────────────────────────────────────── */}
      <div className="content-container max-w-3xl mb-6">
        <div className="flex items-center gap-3 text-xs text-ui-fg-muted flex-wrap">
          <span className="text-ui-fg-interactive">{post.category}</span>
          <span>·</span>
          <span>{post.date}</span>
          <span>·</span>
          <span>{post.read_time} de lecture</span>
        </div>
        <div className="mt-4 flex items-center gap-3">
          <div className="w-7 h-7 rounded-full bg-ui-bg-subtle border border-ui-border-base flex items-center justify-center text-xs font-medium text-ui-fg-base">
            {post.author.charAt(0)}
          </div>
          <span className="text-sm text-ui-fg-subtle">{post.author}</span>
        </div>
        <div className="h-px bg-ui-border-base mt-6" />
      </div>

      {/* ── Corps ────────────────────────────────────────────────────── */}
      <article className="content-container max-w-3xl pb-24">
        <BlockRenderer blocks={bodyBlocks} />
      </article>

      {/* ── Footer ───────────────────────────────────────────────────── */}
      <div className="border-t border-ui-border-base bg-ui-bg-subtle">
        <div className="content-container max-w-3xl py-10 flex items-center justify-between">
          <div>
            <p className="text-xs text-ui-fg-muted uppercase tracking-widest mb-1">Écrit par</p>
            <p className="text-ui-fg-base">{post.author}</p>
          </div>
          <Link href="/blog" className="text-sm text-ui-fg-interactive hover:text-ui-fg-interactive-hover transition-colors">
            ← Retour au blog
          </Link>
        </div>
      </div>

    </div>
  )
}
