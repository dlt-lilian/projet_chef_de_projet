import { Metadata } from "next"

import { SortOptions } from "@modules/store/components/refinement-list/sort-products"
import StoreTemplate from "@modules/store/templates"
import JsonLd from "@modules/common/components/json-ld"
import { breadcrumbJsonLd, canonicalPath } from "@lib/util/seo"

type Params = {
  searchParams: Promise<{
    sortBy?: SortOptions
    page?: string
  }>
  params: Promise<{
    countryCode: string
  }>
}

export async function generateMetadata(props: {
  params: Promise<{ countryCode: string }>
}): Promise<Metadata> {
  const { countryCode } = await props.params
  const canonical = canonicalPath(countryCode, "/store")
  const description =
    "Toute la boutique Hinaso : baguettes, éventails et parapluies japonais faits main. Matériaux nobles et livraison soignée."

  return {
    title: "Toute la boutique",
    description,
    alternates: { canonical },
    openGraph: {
      title: "Toute la boutique | Hinaso",
      description,
      url: canonical,
    },
  }
}

export default async function StorePage(props: Params) {
  const params = await props.params;
  const searchParams = await props.searchParams;
  const { sortBy, page } = searchParams

  return (
    <>
      <JsonLd
        data={breadcrumbJsonLd([
          { name: "Accueil", path: canonicalPath(params.countryCode) },
          { name: "Boutique", path: canonicalPath(params.countryCode, "/store") },
        ])}
      />
      <StoreTemplate
        sortBy={sortBy}
        page={page}
        countryCode={params.countryCode}
      />
    </>
  )
}
