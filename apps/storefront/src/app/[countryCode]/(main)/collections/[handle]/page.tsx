import { Metadata } from "next"
import { notFound } from "next/navigation"

import { getCollectionByHandle, listCollections } from "@lib/data/collections"
import { listRegions } from "@lib/data/regions"
import { StoreCollection, StoreRegion } from "@medusajs/types"
import CollectionTemplate from "@modules/collections/templates"
import { SortOptions } from "@modules/store/components/refinement-list/sort-products"
import JsonLd from "@modules/common/components/json-ld"
import {
  breadcrumbJsonLd,
  canonicalPath,
  hreflangAlternates,
  itemListJsonLd,
} from "@lib/util/seo"

type Props = {
  params: Promise<{ handle: string; countryCode: string }>
  searchParams: Promise<{
    page?: string
    sortBy?: SortOptions
  }>
}

export const PRODUCT_LIMIT = 12

export async function generateStaticParams() {
  // Repli gracieux si le backend est injoignable au build (même schéma que
  // products/categories/blog) : sans ce try/catch, une simple indisponibilité
  // du backend au moment du build Railway ferait échouer tout le déploiement.
  try {
    const { collections } = await listCollections({
      fields: "*products",
    })

    if (!collections) {
      return []
    }

    const countryCodes = await listRegions().then(
      (regions: StoreRegion[]) =>
        regions
          ?.map((r) => r.countries?.map((c) => c.iso_2))
          .flat()
          .filter(Boolean) as string[]
    )

    const collectionHandles = collections.map(
      (collection: StoreCollection) => collection.handle
    )

    const staticParams = countryCodes
      ?.map((countryCode: string) =>
        collectionHandles.map((handle: string | undefined) => ({
          countryCode,
          handle,
        }))
      )
      .flat()

    return staticParams
  } catch (error) {
    console.error(
      `Failed to generate static paths for collection pages: ${
        error instanceof Error ? error.message : "Unknown error"
      }.`
    )
    return []
  }
}

export async function generateMetadata(props: Props): Promise<Metadata> {
  const params = await props.params
  const collection = await getCollectionByHandle(params.handle)

  if (!collection) {
    notFound()
  }

  const subPath = `/collections/${params.handle}`
  const canonical = canonicalPath(params.countryCode, subPath)
  const description = `Collection ${collection.title} — pièces d'artisanat japonais faites main par Hinaso.`

  return {
    // Le gabarit du layout racine ajoute « | Hinaso ».
    title: collection.title,
    description,
    alternates: { canonical, languages: hreflangAlternates(subPath) },
    openGraph: {
      title: `${collection.title} | Hinaso`,
      description,
      url: canonical,
    },
  }
}

export default async function CollectionPage(props: Props) {
  const searchParams = await props.searchParams
  const params = await props.params
  const { sortBy, page } = searchParams

  const collection = await getCollectionByHandle(params.handle).then(
    (collection) => collection
  )

  if (!collection) {
    notFound()
  }

  const collectionPath = canonicalPath(
    params.countryCode,
    `/collections/${params.handle}`
  )
  const products = collection.products ?? []
  const jsonLd: Record<string, unknown>[] = [
    breadcrumbJsonLd([
      { name: "Accueil", path: canonicalPath(params.countryCode) },
      { name: "Boutique", path: canonicalPath(params.countryCode, "/store") },
      { name: collection.title, path: collectionPath },
    ]),
  ]
  if (products.length) {
    jsonLd.push(
      itemListJsonLd(
        products.map((p) => ({
          name: p.title,
          path: canonicalPath(params.countryCode, `/products/${p.handle}`),
        }))
      )
    )
  }

  return (
    <>
      <JsonLd data={jsonLd} />
      <CollectionTemplate
        collection={collection}
        page={page}
        sortBy={sortBy}
        countryCode={params.countryCode}
      />
    </>
  )
}
