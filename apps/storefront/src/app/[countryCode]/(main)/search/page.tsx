import { Metadata } from "next"

import { canonicalPath, hreflangAlternates } from "@lib/util/seo"
import SearchTemplate from "@modules/search/templates"

type Params = {
  params: Promise<{ countryCode: string }>
  searchParams: Promise<{ q?: string }>
}

export async function generateMetadata(props: Params): Promise<Metadata> {
  const { countryCode } = await props.params
  const { q } = await props.searchParams
  const canonical = canonicalPath(countryCode, "/search")
  const description =
    "Recherchez parmi les produits et les articles Hinaso : baguettes, éventails, parapluies et récits d'atelier."

  return {
    title: q ? `Recherche : ${q}` : "Recherche",
    description,
    alternates: { canonical, languages: hreflangAlternates("/search") },
    // Une page de résultats n'a pas vocation à être indexée (contenu variable
    // et dupliqué du catalogue), mais ses liens doivent rester suivis.
    robots: { index: false, follow: true },
  }
}

export default async function SearchPage(props: Params) {
  const { countryCode } = await props.params
  const { q } = await props.searchParams

  return <SearchTemplate query={q ?? ""} countryCode={countryCode} />
}
