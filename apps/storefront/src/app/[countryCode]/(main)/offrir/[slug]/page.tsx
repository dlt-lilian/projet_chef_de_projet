import { notFound, permanentRedirect } from "next/navigation"
import { getArticleBySlug, getOffrirArticleBySlug } from "@lib/blog"
import { extractFaqFromBlocks } from "@lib/blog/faq"
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
 * ⚠️ `force-dynamic` est OBLIGATOIRE ici, sans `revalidate` ni
 * `generateStaticParams` (même régime que /[pagePath], voir son en-tête).
 *
 * La première version copiait /blog/[slug] et répondait 500 en production.
 * Au build, aucun article n'était encore coché « Offrir » : la liste de
 * `generateStaticParams` était vide, aucune page n'a été prérendue, et Next
 * n'a donc jamais vu le layout (main) lire les cookies. La route est restée
 * classée statique ; au premier rendu réel, cette lecture de cookies a levé
 * « Page changed from static to dynamic at runtime ».
 *
 * /blog/[slug] et les fiches produit n'y échappent que parce que leur build
 * trouve des pages à prérendre, qui révèlent les cookies et font basculer la
 * route en dynamique. Ce prérendu est de toute façon jeté : on n'y perd rien.
 * La fraîcheur est assurée en amont par le cache de 60 s de
 * `getOffrirArticleBySlug`, que `force-dynamic` respecte (`next.revalidate`
 * explicite).
 */

// Next.js 15 : params est une Promise
type Props = { params: Promise<{ slug: string; countryCode: string }> }

export const dynamic = "force-dynamic"

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
