import { notFound } from "next/navigation"
import { getAllPages, getPageByPath } from "@lib/blog"
import { listRegions } from "@lib/data/regions"
import ArticleTemplate from "@modules/blog/templates/article"
import type { Metadata } from "next"
import JsonLd from "@modules/common/components/json-ld"
import { canonicalPath, hreflangAlternates, webPageJsonLd } from "@lib/util/seo"

/**
 * Pages autonomes rédigées dans le backoffice (mentions légales, CGV…) :
 * un article de blog doté d'une URL personnalisée est servi ici, à la racine
 * du pays, plutôt que sous /blog.
 *
 * ⚠️ Segment dynamique le plus large du site : il n'attrape que ce qu'aucune
 * route fixe ne prend (en Next.js, /store, /blog, /contact… gagnent toujours).
 * Un chemin sans page correspondante retombe donc sur le 404 habituel.
 *
 * `dynamicParams` reste à sa valeur par défaut (true) : une page créée dans
 * l'admin est en ligne à la revalidation suivante, sans redéploiement.
 */

// Next.js 15 : params est une Promise
type Props = { params: Promise<{ pagePath: string; countryCode: string }> }

export const revalidate = 60

export async function generateStaticParams() {
  try {
    // Deux segments dynamiques ([countryCode] et [pagePath]) : les deux
    // doivent être fournis, sinon le build de prod échoue.
    const countryCodes = await listRegions().then((regions) =>
      regions?.map((r) => r.countries?.map((c) => c.iso_2)).flat()
    )

    if (!countryCodes) return []

    const pages = await getAllPages()

    return countryCodes
      .filter(Boolean)
      .flatMap((countryCode) =>
        pages
          .filter((p) => p.path)
          .map((p) => ({
            countryCode: countryCode as string,
            pagePath: p.path as string,
          }))
      )
  } catch (error) {
    console.error(
      `Failed to generate static paths for standalone pages: ${
        error instanceof Error ? error.message : "Unknown error"
      }.`
    )
    return []
  }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { pagePath, countryCode } = await params
  const page = await getPageByPath(pagePath)
  if (!page) return {}

  const canonical = canonicalPath(countryCode, `/${pagePath}`)
  return {
    title: page.title,
    description: page.excerpt,
    alternates: { canonical, languages: hreflangAlternates(`/${pagePath}`) },
    openGraph: {
      title: `${page.title} | Hinaso`,
      description: page.excerpt,
      url: canonical,
      type: "website",
      images: page.cover ? [{ url: page.cover }] : [],
    },
  }
}

export default async function StandalonePage({ params }: Props) {
  const { pagePath, countryCode } = await params
  const page = await getPageByPath(pagePath)
  if (!page) notFound()

  return (
    <>
      <JsonLd
        data={webPageJsonLd({
          title: page.title,
          description: page.excerpt,
          path: canonicalPath(countryCode, `/${pagePath}`),
        })}
      />
      <ArticleTemplate post={page} />
    </>
  )
}
