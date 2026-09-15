import { Metadata } from "next"

import { getAllOffrirArticles } from "@lib/blog"
import {
  breadcrumbJsonLd,
  canonicalPath,
  hreflangAlternates,
  itemListJsonLd,
} from "@lib/util/seo"
import BlogCard from "@modules/blog/components/BlogCard"
import JsonLd from "@modules/common/components/json-ld"
import LocalizedClientLink from "@modules/common/components/localized-client-link"

/**
 * Page parente de la rubrique « Offrir » : liste les articles cochés
 * « Offrir » dans le backoffice, servis sous /offrir/{slug}.
 *
 * Elle listait jusqu'au 2026-09-15 six landings d'occasion codées en dur
 * (`lib/content/occasions.ts`, supprimé) ; le contenu cadeau se rédige
 * désormais en backoffice, comme le reste du blog.
 *
 * Elle existe pour deux raisons : donner un maillon intermédiaire au fil
 * d'Ariane des articles, et concentrer les liens vers eux depuis un point
 * unique — c'est elle que lie le pied de page, pas chaque article.
 *
 * ⚠️ Elle ne cible AUCUN mot-clé. « cadeau personnalisé » seul est explicitement
 * hors corpus, et lui faire viser une requête d'occasion la mettrait en
 * concurrence avec l'article correspondant.
 *
 * Rubrique VIDE → page toujours servie (le pied de page y mène) mais en
 * `noindex, follow`, et absente du sitemap : une liste sans article est une
 * page mince, qu'il ne faut ni indexer ni annoncer.
 */

type Props = { params: Promise<{ countryCode: string }> }

const DESCRIPTION =
  "Baguettes, éventail et ombrelle à configurer option par option puis à faire graver : nos idées cadeaux, chaque pièce fabriquée en France après commande."

export const revalidate = 60

export async function generateMetadata(props: Props): Promise<Metadata> {
  const { countryCode } = await props.params
  const canonical = canonicalPath(countryCode, "/offrir")
  const articles = await getAllOffrirArticles()

  return {
    title: "Idées cadeaux à configurer et faire graver",
    description: DESCRIPTION,
    alternates: { canonical, languages: hreflangAlternates("/offrir") },
    ...(articles.length === 0 && { robots: { index: false, follow: true } }),
    openGraph: {
      title: "Idées cadeaux à configurer et faire graver | Hinaso",
      description: DESCRIPTION,
      url: canonical,
    },
  }
}

export default async function OffrirPage(props: Props) {
  const { countryCode } = await props.params
  // Même URL et mêmes options que dans generateMetadata : Next déduplique,
  // un seul appel au backend.
  const articles = await getAllOffrirArticles()

  const jsonLd: Record<string, unknown>[] = [
    breadcrumbJsonLd([
      { name: "Accueil", path: canonicalPath(countryCode) },
      { name: "Offrir", path: canonicalPath(countryCode, "/offrir") },
    ]),
  ]

  if (articles.length) {
    jsonLd.push(
      itemListJsonLd(
        articles.map((a) => ({
          name: a.title,
          path: canonicalPath(countryCode, `/offrir/${a.slug}`),
        }))
      )
    )
  }

  return (
    <>
      <JsonLd data={jsonLd} />

      <div className="content-container py-10 md:py-14">
        <nav className="text-xs text-gray-500 mb-4" aria-label="Fil d'Ariane">
          <LocalizedClientLink href="/" className="hover:text-primary">
            Accueil
          </LocalizedClientLink>
          {" / "}
          <span className="text-grey-90">Offrir</span>
        </nav>

        <h1 className="text-3xl md:text-4xl font-semibold text-stone-900 max-w-3xl">
          Offrir un objet qui n&apos;existait pas avant votre commande
        </h1>

        <p className="mt-5 max-w-2xl text-base leading-relaxed text-stone-700">
          Chaque pièce se configure : matière, teinte, motif, finition, puis un
          texte gravé en option. Le rendu 3D montre la combinaison avant
          fabrication. Conçu et fabriqué en France.
        </p>

        {articles.length === 0 ? (
          <p className="text-center text-gray-500 py-24 text-sm">
            Aucune idée cadeau publiée pour l&apos;instant.
          </p>
        ) : (
          <>
            {/* Entre le h1 de la page et les h3 des cartes, comme sur /blog
                (cf. BlogList) : la hiérarchie ne doit pas sauter un niveau. */}
            <h2 className="sr-only">Toutes les idées cadeaux</h2>
            <ul className="mt-10 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-12">
              {articles.map((a) => (
                <li key={a.slug}>
                  <BlogCard slug={a.slug} post={a} />
                </li>
              ))}
            </ul>
          </>
        )}
      </div>
    </>
  )
}
