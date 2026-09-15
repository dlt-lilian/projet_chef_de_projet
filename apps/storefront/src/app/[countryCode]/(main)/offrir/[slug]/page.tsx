import { notFound, permanentRedirect } from "next/navigation"
import {
  getAllOffrirArticles,
  getArticleBySlug,
  getOffrirArticleBySlug,
} from "@lib/blog"
import { extractFaqFromBlocks } from "@lib/blog/faq"
import { listRegions } from "@lib/data/regions"
import ArticleTemplate from "@modules/blog/templates/article"
import type { Metadata } from "next"
import JsonLd from "@modules/common/components/json-ld"
import {
  blogPostingJsonLd,
  breadcrumbJsonLd,
  canonicalPath,
  faqPageJsonLd,
  hreflangAlternates,
} from "@lib/util/seo"

/**
 * Articles de la rubrique « Offrir » — /{pays}/offrir/{slug}.
 *
 * Un article coché « Offrir » dans le backoffice est servi ici plutôt que sous
 * /blog/{slug} : même gabarit, mêmes blocs, seule l'adresse change. Il reste
 * listé sur /blog, où sa carte pointe ici ; le backend refuse de le servir
 * sous /blog/{slug}, ce qui évite tout doublon de contenu.
 *
 * Pendant exact de /blog/[slug] (même `revalidate`, même prérendu) : les
 * écarts entre les deux routes doivent rester ceux du fil d'Ariane et des
 * redirections croisées.
 */

// Next.js 15 : params est une Promise
type Props = { params: Promise<{ slug: string; countryCode: string }> }

export const revalidate = 60

export async function generateStaticParams() {
  try {
    // Deux segments dynamiques, [countryCode] et [slug] : generateStaticParams
    // doit fournir les deux (cf. blog/[slug]).
    const countryCodes = await listRegions().then((regions) =>
      regions?.map((r) => r.countries?.map((c) => c.iso_2)).flat()
    )

    if (!countryCodes) return []

    const articles = await getAllOffrirArticles()

    return countryCodes
      .filter(Boolean)
      .flatMap((countryCode) =>
        articles.map(({ slug }) => ({ countryCode: countryCode as string, slug }))
      )
  } catch (error) {
    console.error(
      `Failed to generate static paths for offrir pages: ${
        error instanceof Error ? error.message : "Unknown error"
      }.`
    )
    return []
  }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug, countryCode } = await params
  const post = await getOffrirArticleBySlug(slug)
  if (!post) return {}
  const canonical = canonicalPath(countryCode, `/offrir/${slug}`)
  const ogTitle = `${post.title} | Hinaso`
  return {
    title: post.title,
    description: post.excerpt,
    alternates: { canonical, languages: hreflangAlternates(`/offrir/${slug}`) },
    openGraph: {
      title: ogTitle,
      description: post.excerpt,
      url: canonical,
      type: "article",
      publishedTime: post.date_iso,
      images: post.cover ? [{ url: post.cover }] : [],
    },
    twitter: {
      card: "summary_large_image",
      title: ogTitle,
      description: post.excerpt,
      images: post.cover ? [post.cover] : [],
    },
  }
}

export default async function OffrirArticlePage({ params }: Props) {
  const { slug, countryCode } = await params
  const post = await getOffrirArticleBySlug(slug)

  if (!post) {
    // Article repassé au blog après avoir été publié ici : son ancienne
    // adresse redirige (308) vers la nouvelle au lieu de répondre 404.
    if (await getArticleBySlug(slug)) {
      permanentRedirect(`/${countryCode}/blog/${slug}`)
    }
    notFound()
  }

  const path = canonicalPath(countryCode, `/offrir/${slug}`)

  const jsonLd: Record<string, unknown>[] = [
    blogPostingJsonLd({
      title: post.title,
      description: post.excerpt,
      image: post.cover,
      path,
      author: post.author,
      datePublished: post.date_iso,
    }),
    // Contrairement au blog, la rubrique a une page parente qui liste ses
    // articles : le fil d'Ariane reprend celui des anciennes landings.
    breadcrumbJsonLd([
      { name: "Accueil", path: canonicalPath(countryCode) },
      { name: "Offrir", path: canonicalPath(countryCode, "/offrir") },
      { name: post.title, path },
    ]),
  ]

  // FAQPage : même convention que le blog (cf. `lib/blog/faq.ts`).
  const faq = extractFaqFromBlocks(post.blocks)
  if (faq.length) {
    jsonLd.push(faqPageJsonLd(faq))
  }

  return (
    <>
      <JsonLd data={jsonLd} />
      <ArticleTemplate post={post} />
    </>
  )
}
