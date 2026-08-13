import { notFound } from "next/navigation"
import { getPageByPath } from "@lib/blog"
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
 * ⚠️ `force-dynamic` est OBLIGATOIRE ici, ne pas le remplacer par `revalidate`.
 * Le layout (main) lit les cookies à chaque requête (retrieveCustomer /
 * retrieveCart). Avec `revalidate`, Next tente une génération statique de la
 * route et cette lecture de cookies lève alors DYNAMIC_SERVER_USAGE au lieu de
 * basculer en rendu dynamique → 500 sur TOUTES les URL captées, page existante
 * ou non. Les autres routes dynamiques de l'app (products, collections,
 * categories) sont dans le même cas et ne déclarent aucun `revalidate`.
 *
 * La fraîcheur reste assurée en amont : `getPageByPath` met la réponse du
 * backend en cache 60 s. Pas de `generateStaticParams` non plus — sans
 * prérendu il ne servirait à rien, et une page créée dans l'admin est en
 * ligne immédiatement, sans redéploiement.
 */

// Next.js 15 : params est une Promise
type Props = { params: Promise<{ pagePath: string; countryCode: string }> }

export const dynamic = "force-dynamic"

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
