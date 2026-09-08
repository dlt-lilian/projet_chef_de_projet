import { Metadata } from "next"
import { notFound } from "next/navigation"

import { getCategoryByHandle, listCategories } from "@lib/data/categories"
import { listRegions } from "@lib/data/regions"
import { HttpTypes, StoreRegion } from "@medusajs/types"
import CategoryTemplate from "@modules/categories/templates"
import { SortOptions } from "@modules/store/components/refinement-list/sort-products"
import JsonLd from "@modules/common/components/json-ld"
import {
  breadcrumbJsonLd,
  canonicalPath,
  hreflangAlternates,
  itemListJsonLd,
} from "@lib/util/seo"
import { getCategorySeo } from "@lib/content/categories"

type Props = {
  params: Promise<{ category: string[]; countryCode: string }>
  searchParams: Promise<{
    sortBy?: SortOptions
    page?: string
  }>
}

export async function generateStaticParams() {
  // Repli gracieux si le backend est injoignable au build (même schéma que
  // products/collections/blog) : évite qu'une indisponibilité du backend au
  // build Railway ne fasse échouer tout le déploiement.
  try {
    const product_categories = await listCategories()

    if (!product_categories) {
      return []
    }

    const countryCodes = await listRegions().then((regions: StoreRegion[]) =>
      regions?.map((r) => r.countries?.map((c) => c.iso_2)).flat()
    )

    const categoryHandles = product_categories.map(
      (category: HttpTypes.StoreProductCategory) => category.handle
    )

    const staticParams = countryCodes
      ?.map((countryCode: string | undefined) =>
        categoryHandles.map((handle: string) => ({
          countryCode,
          category: [handle],
        }))
      )
      .flat()

    return staticParams
  } catch (error) {
    console.error(
      `Failed to generate static paths for category pages: ${
        error instanceof Error ? error.message : "Unknown error"
      }.`
    )
    return []
  }
}

export async function generateMetadata(props: Props): Promise<Metadata> {
  const params = await props.params
  try {
    const productCategory = await getCategoryByHandle(params.category)

    const subPath = `/categories/${params.category.join("/")}`
    const canonical = canonicalPath(params.countryCode, subPath)

    // Le nom de catégorie fait un H1 correct mais un mauvais title SEO
    // (« Baguettes japonaises | Hinaso » laisse la moitié de la place en SERP).
    // Quand la catégorie a des métadonnées calibrées, elles priment.
    const seo = getCategorySeo(params.category[params.category.length - 1])

    const description =
      seo?.seoDescription ??
      (
        productCategory.description ||
        `${productCategory.name} : essence, couleur, motif et finitions au choix, à configurer en 3D. Conçus et fabriqués en France par Hinaso.`
      ).slice(0, 160)
    const title = seo?.seoTitle ?? productCategory.name

    return {
      // Le gabarit du layout racine ajoute « | Hinaso » (plus de double suffixe).
      title,
      description,
      alternates: { canonical, languages: hreflangAlternates(subPath) },
      openGraph: {
        title: `${title} | Hinaso`,
        description,
        url: canonical,
      },
      // `noindex, follow` : depuis que le contenu éditorial est parti au blog,
      // une catégorie n'affiche plus qu'un listing d'une seule référence — une
      // page mince qui ferait concurrence à la fiche qu'elle liste. Le `follow`
      // laisse circuler le maillage : la page ne se positionne pas, mais
      // transmet toujours vers la fiche. Cf. `content/categories.ts`.
      ...(seo?.noindex ? { robots: { index: false, follow: true } } : {}),
    }
  } catch {
    notFound()
  }
}

export default async function CategoryPage(props: Props) {
  const searchParams = await props.searchParams
  const params = await props.params
  const { sortBy, page } = searchParams

  const productCategory = await getCategoryByHandle(params.category)

  if (!productCategory) {
    notFound()
  }

  const categoryPath = canonicalPath(
    params.countryCode,
    `/categories/${params.category.join("/")}`
  )
  const products = productCategory.products ?? []
  const jsonLd: Record<string, unknown>[] = [
    breadcrumbJsonLd([
      { name: "Accueil", path: canonicalPath(params.countryCode) },
      { name: "Boutique", path: canonicalPath(params.countryCode, "/store") },
      { name: productCategory.name, path: categoryPath },
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

  // Plus de bloc éditorial ni de FAQPage ici : le texte long et les questions
  // sont partis au blog (cf. `content/categories.ts`). Un FAQPage sur une page
  // en noindex n'aurait de toute façon aucun effet.
  return (
    <>
      <JsonLd data={jsonLd} />
      <CategoryTemplate
        category={productCategory}
        sortBy={sortBy}
        page={page}
        countryCode={params.countryCode}
      />
    </>
  )
}
