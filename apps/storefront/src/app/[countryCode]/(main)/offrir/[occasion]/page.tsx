import { Metadata } from "next"
import { notFound } from "next/navigation"

import { getOccasionLanding, OCCASION_LANDINGS } from "@lib/content/occasions"
import { listProducts } from "@lib/data/products"
import { getRegion, listRegions } from "@lib/data/regions"
import {
  breadcrumbJsonLd,
  canonicalPath,
  faqPageJsonLd,
  hreflangAlternates,
  itemListJsonLd,
} from "@lib/util/seo"
import JsonLd from "@modules/common/components/json-ld"
import EditorialSection from "@modules/common/components/editorial"
import ProductCard from "@modules/products/components/product-preview"
import LocalizedClientLink from "@modules/common/components/localized-client-link"

/**
 * Landings d'occasion — /{pays}/offrir/{occasion}.
 *
 * POURQUOI une route dédiée plutôt qu'une page de backoffice. Ces pages ont
 * besoin d'une grille produits, d'un `ItemList`, d'une `FAQPage` et d'un
 * maillage vers les fiches : le moteur de blocs du blog ne produit aucun des
 * quatre. Elles portent par ailleurs 9 233 recherches mensuelles, soit plus de
 * quatre fois le catalogue entier — l'investissement se justifie.
 *
 * POURQUOI /offrir/{slug} et non un chemin à la racine. Le segment racine est
 * déjà capté par `[pagePath]` (pages rédigées en admin) : y poser des routes
 * statiques créerait un conflit dès qu'une page porterait le même chemin.
 *
 * Le contenu vit dans `lib/content/occasions.ts` — source unique du HTML et du
 * JSON-LD.
 */

type Props = {
  params: Promise<{ countryCode: string; occasion: string }>
}

export async function generateStaticParams() {
  // Même repli gracieux que les autres routes : une indisponibilité du backend
  // au build Railway ne doit pas faire échouer le déploiement.
  try {
    const countryCodes = await listRegions().then((regions) =>
      regions?.map((r) => r.countries?.map((c) => c.iso_2)).flat()
    )
    if (!countryCodes) return []

    return countryCodes
      .filter((c): c is string => Boolean(c))
      .flatMap((countryCode) =>
        OCCASION_LANDINGS.map((o) => ({ countryCode, occasion: o.slug }))
      )
  } catch (error) {
    console.error(
      `Failed to generate static paths for occasion landings: ${
        error instanceof Error ? error.message : "Unknown error"
      }.`
    )
    return []
  }
}

export async function generateMetadata(props: Props): Promise<Metadata> {
  const { countryCode, occasion } = await props.params
  const landing = getOccasionLanding(occasion)
  if (!landing) notFound()

  const subPath = `/offrir/${landing.slug}`
  const canonical = canonicalPath(countryCode, subPath)

  return {
    title: landing.seoTitle,
    description: landing.seoDescription,
    alternates: { canonical, languages: hreflangAlternates(subPath) },
    openGraph: {
      title: `${landing.seoTitle} | Hinaso`,
      description: landing.seoDescription,
      url: canonical,
    },
  }
}

export default async function OccasionPage(props: Props) {
  const { countryCode, occasion } = await props.params
  const landing = getOccasionLanding(occasion)
  if (!landing) notFound()

  const region = await getRegion(countryCode)
  if (!region) notFound()

  // Un seul appel : alimente la grille ET l'ItemList. Deux fetchs
  // produiraient deux listes potentiellement différentes — donc un JSON-LD qui
  // ne décrit pas ce que la page affiche.
  const { response } = await listProducts({
    countryCode,
    queryParams: { limit: 12 },
  })
  const products = response.products

  const landingPath = canonicalPath(countryCode, `/offrir/${landing.slug}`)

  const jsonLd: Record<string, unknown>[] = [
    breadcrumbJsonLd([
      { name: "Accueil", path: canonicalPath(countryCode) },
      { name: "Offrir", path: canonicalPath(countryCode, "/offrir") },
      { name: landing.breadcrumbLabel, path: landingPath },
    ]),
    faqPageJsonLd(landing.faq),
  ]

  if (products.length) {
    jsonLd.push(
      itemListJsonLd(
        products.map((p) => ({
          name: p.title,
          path: canonicalPath(countryCode, `/products/${p.handle}`),
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
          <LocalizedClientLink href="/offrir" className="hover:text-primary">
            Offrir
          </LocalizedClientLink>
          {" / "}
          <span className="text-grey-90">{landing.breadcrumbLabel}</span>
        </nav>

        {/* H1 distinct du title : le title vise la requête, le H1 parle au
            lecteur qui vient d'arriver. */}
        <h1 className="text-3xl md:text-4xl font-semibold text-stone-900 max-w-3xl">
          {landing.h1}
        </h1>
      </div>

      <EditorialSection
        editorial={{
          intro: landing.intro,
          sections: landing.sections,
          // La FAQ est rendue APRÈS la grille produits (voir plus bas) : on ne
          // la duplique pas ici.
          faq: [],
        }}
      />

      {products.length > 0 && (
        <section className="content-container my-12 md:my-16 flex flex-col gap-6">
          <h2 className="text-2xl md:text-3xl font-semibold text-grey-90">
            {landing.productHeading}
          </h2>
          <ul className="grid grid-cols-2 sm:grid-cols-3 gap-5 md:gap-6 w-full">
            {products.map((product) => (
              <li key={product.id}>
                <ProductCard product={product} region={region} />
              </li>
            ))}
          </ul>
        </section>
      )}

      <EditorialSection editorial={{ sections: [], faq: landing.faq }} />
    </>
  )
}
