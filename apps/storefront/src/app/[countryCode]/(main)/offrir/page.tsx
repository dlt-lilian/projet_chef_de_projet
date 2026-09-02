import { Metadata } from "next"

import { OCCASION_LANDINGS } from "@lib/content/occasions"
import {
  breadcrumbJsonLd,
  canonicalPath,
  hreflangAlternates,
  itemListJsonLd,
} from "@lib/util/seo"
import JsonLd from "@modules/common/components/json-ld"
import LocalizedClientLink from "@modules/common/components/localized-client-link"

/**
 * Page parente des landings d'occasion.
 *
 * Elle existe pour deux raisons : donner un maillon intermédiaire au fil
 * d'Ariane des landings, et concentrer les liens vers les six pages depuis un
 * point unique — un pied de page qui listerait six occasions supplémentaires
 * diluerait le maillage plutôt que de le renforcer.
 *
 * ⚠️ Elle ne cible AUCUN mot-clé. « cadeau personnalisé » seul est explicitement
 * hors corpus, et lui faire viser une requête d'occasion la mettrait en
 * concurrence avec la landing correspondante.
 */

type Props = { params: Promise<{ countryCode: string }> }

const DESCRIPTION =
  "Baguettes, éventail et ombrelle à configurer option par option puis à faire graver. Six occasions, une pièce fabriquée en France après commande."

export async function generateMetadata(props: Props): Promise<Metadata> {
  const { countryCode } = await props.params
  const canonical = canonicalPath(countryCode, "/offrir")

  return {
    title: "Idées cadeaux à configurer et faire graver",
    description: DESCRIPTION,
    alternates: { canonical, languages: hreflangAlternates("/offrir") },
    openGraph: {
      title: "Idées cadeaux à configurer et faire graver | Hinaso",
      description: DESCRIPTION,
      url: canonical,
    },
  }
}

export default async function OffrirPage(props: Props) {
  const { countryCode } = await props.params

  const jsonLd = [
    breadcrumbJsonLd([
      { name: "Accueil", path: canonicalPath(countryCode) },
      { name: "Offrir", path: canonicalPath(countryCode, "/offrir") },
    ]),
    itemListJsonLd(
      OCCASION_LANDINGS.map((o) => ({
        name: o.breadcrumbLabel,
        path: canonicalPath(countryCode, `/offrir/${o.slug}`),
      }))
    ),
  ]

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

        <ul className="mt-10 grid grid-cols-1 sm:grid-cols-2 gap-4">
          {OCCASION_LANDINGS.map((o) => (
            <li key={o.slug}>
              <LocalizedClientLink
                href={`/offrir/${o.slug}`}
                className="block rounded-xl border border-stone-200 p-5 transition-colors hover:border-stone-400"
              >
                {/* L'ancre reprend le H1 de la cible, plus précis que la requête
                    visée : une ancre en correspondance exacte répétée sur tout
                    le site est le premier signal de sur-optimisation. */}
                <span className="block text-base font-medium text-stone-900">
                  {o.h1}
                </span>
                <span className="mt-1 block text-sm text-stone-600">
                  {o.breadcrumbLabel}
                </span>
              </LocalizedClientLink>
            </li>
          ))}
        </ul>
      </div>
    </>
  )
}
