import { Metadata } from "next"
import { notFound } from "next/navigation"
import { listProducts } from "@lib/data/products"
import { getRegion, listRegions } from "@lib/data/regions"
import { retrieveCart } from "@lib/data/cart"
import ProductTemplate from "@modules/products/templates"
import ConfiguratorLayout from "@modules/configurator/components/ConfiguratorLayout"
import {
  getProductConfig,
  isConfigurableProduct,
} from "@modules/configurator/config/configurableProducts"
import {
  InitialConfiguration,
  readConfiguratorSelections,
} from "@modules/configurator/lib/persistence"
import { fetchProductConfig } from "@lib/configurator"
import { HttpTypes } from "@medusajs/types"
import JsonLd from "@modules/common/components/json-ld"
import { getProductPrice } from "@lib/util/get-product-price"
import {
  breadcrumbJsonLd,
  canonicalPath,
  faqPageJsonLd,
  hreflangAlternates,
  productJsonLd,
} from "@lib/util/seo"
import { getProductEditorial } from "@lib/content/products"
import EditorialSection from "@modules/common/components/editorial"

type Props = {
  params: Promise<{ countryCode: string; handle: string }>
  searchParams: Promise<{ v_id?: string; line?: string }>
}

export async function generateStaticParams() {
  try {
    const countryCodes = await listRegions().then((regions) =>
      regions?.map((r) => r.countries?.map((c) => c.iso_2)).flat()
    )

    if (!countryCodes) {
      return []
    }

    const promises = countryCodes.map(async (country) => {
      const { response } = await listProducts({
        countryCode: country,
        queryParams: { limit: 100, fields: "handle" },
      })

      return {
        country,
        products: response.products,
      }
    })

    const countryProducts = await Promise.all(promises)

    return countryProducts
      .flatMap((countryData) =>
        countryData.products.map((product) => ({
          countryCode: countryData.country,
          handle: product.handle,
        }))
      )
      .filter((param) => param.handle)
  } catch (error) {
    console.error(
      `Failed to generate static paths for product pages: ${
        error instanceof Error ? error.message : "Unknown error"
      }.`
    )
    return []
  }
}

function getImagesForVariant(
  product: HttpTypes.StoreProduct,
  selectedVariantId?: string
) {
  if (!selectedVariantId || !product.variants) {
    return product.images
  }

  const variant = product.variants!.find((v) => v.id === selectedVariantId)
  if (!variant || !variant.images?.length) {
    return product.images
  }

  const imageIdsMap = new Map(variant.images!.map((i) => [i.id, true]))
  return product.images?.filter((i) => imageIdsMap.has(i.id)) ?? null
}

export async function generateMetadata(props: Props): Promise<Metadata> {
  const params = await props.params
  const { handle } = params
  const region = await getRegion(params.countryCode)

  if (!region) {
    notFound()
  }

  const product = await listProducts({
    countryCode: params.countryCode,
    queryParams: { handle },
  }).then(({ response }) => response.products[0])

  if (!product) {
    notFound()
  }

  const canonical = canonicalPath(params.countryCode, `/products/${handle}`)

  // Le titre produit Medusa nomme l'article ; il ne fait pas un bon title SEO
  // (« Ombrelle Japonaise | Hinaso » = 28 caractères, la moitié de la place
  // disponible en SERP). Quand la fiche a un contenu éditorial, ses `seoTitle`
  // et `seoDescription` — calibrés 55-60 et 140-155 caractères — priment.
  const editorial = getProductEditorial(handle)

  const description =
    editorial?.seoDescription ??
    (
      product.description ||
      product.subtitle ||
      `${product.title} — à configurer en 3D, conçu et fabriqué en France par Hinaso.`
    ).slice(0, 160)
  const title = editorial?.seoTitle ?? product.title
  const images = product.thumbnail ? [product.thumbnail] : []
  const ogTitle = `${title} | Hinaso`

  return {
    // Le gabarit du layout racine ajoute « | Hinaso » au titre.
    title,
    description,
    alternates: { canonical, languages: hreflangAlternates(`/products/${handle}`) },
    openGraph: {
      title: ogTitle,
      description,
      url: canonical,
      images,
    },
    twitter: {
      card: "summary_large_image",
      title: ogTitle,
      description,
      images,
    },
  }
}

export default async function ProductPage(props: Props) {
  const params = await props.params
  const region = await getRegion(params.countryCode)
  const searchParams = await props.searchParams

  const selectedVariantId = searchParams.v_id

  if (!region) {
    notFound()
  }

  const pricedProduct = await listProducts({
    countryCode: params.countryCode,
    queryParams: { handle: params.handle },
  }).then(({ response }) => response.products[0])

  if (!pricedProduct) {
    notFound()
  }

  // Données structurées (Product + Offer + fil d'Ariane), rendues pour TOUS les
  // produits — y compris les configurables, dont la page 3D contient très peu de
  // texte indexable : c'est ici que Google récupère nom, prix, dispo et image.
  const { cheapestPrice } = getProductPrice({ product: pricedProduct })
  const inStock =
    pricedProduct.variants?.some(
      (v) =>
        v.manage_inventory === false ||
        v.allow_backorder === true ||
        (v.inventory_quantity ?? 0) > 0
    ) ?? false
  const productPath = canonicalPath(
    params.countryCode,
    `/products/${pricedProduct.handle}`
  )
  const editorial = getProductEditorial(pricedProduct.handle)

  // Première catégorie rattachée : chaque produit n'en a qu'une aujourd'hui.
  const productCategory = pricedProduct.categories?.[0]

  const jsonLd = [
    productJsonLd({
      name: pricedProduct.title,
      description: pricedProduct.description,
      images: [
        pricedProduct.thumbnail,
        ...(pricedProduct.images?.map((i) => i.url) ?? []),
      ],
      sku: pricedProduct.variants?.[0]?.sku ?? pricedProduct.id,
      path: productPath,
      price: cheapestPrice?.calculated_price_number ?? null,
      currency: cheapestPrice?.currency_code ?? region.currency_code,
      availability: inStock ? "InStock" : "OutOfStock",
      material: editorial?.material,
      countryOfOrigin: editorial?.countryOfOrigin,
    }),
    // Fil d'Ariane : Accueil › Boutique › Catégorie › Produit. Le niveau
    // catégorie vient du rattachement réel en base et disparaît si le produit
    // n'en a aucun — jamais de maillon vers une URL qui n'existerait pas.
    breadcrumbJsonLd([
      { name: "Accueil", path: canonicalPath(params.countryCode) },
      { name: "Boutique", path: canonicalPath(params.countryCode, "/store") },
      ...(productCategory
        ? [
            {
              name: productCategory.name,
              path: canonicalPath(
                params.countryCode,
                `/categories/${productCategory.handle}`
              ),
            },
          ]
        : []),
      { name: pricedProduct.title, path: productPath },
    ]),
  ]

  // FAQPage seulement si les questions sont réellement affichées plus bas :
  // Google invalide un FAQPage dont le contenu n'est pas visible sur la page.
  if (editorial?.faq.length) {
    jsonLd.push(faqPageJsonLd(editorial.faq))
  }

  if (isConfigurableProduct(pricedProduct.handle)) {
    // Config éditable depuis l'admin (table configurator_*), avec repli sur la
    // config statique si le backend ne répond pas.
    const config =
      (await fetchProductConfig(pricedProduct.handle)) ??
      getProductConfig(pricedProduct.handle)

    // Rouverture d'un article du panier (`?line=<id>`) : on relit sa config
    // depuis le metadata de la ligne pour rouvrir exactement cette version.
    // Fetch du panier UNIQUEMENT si `?line` est présent → pas d'impact sur les
    // vues normales (SEO / visiteurs sans panier).
    let initialConfiguration: InitialConfiguration | undefined
    if (searchParams.line) {
      const cart = await retrieveCart()
      const line = cart?.items?.find((item) => item.id === searchParams.line)
      initialConfiguration =
        readConfiguratorSelections(line?.metadata) ?? undefined
    }

    return (
      <>
        <JsonLd data={jsonLd} />
        <ConfiguratorLayout
          product={pricedProduct}
          config={config}
          initialConfiguration={initialConfiguration}
        />
        {/* Rendu APRÈS le configurateur : sur ces fiches, c'est le seul texte
            indexable de la page — le configurateur est un composant client dont
            le corps ne contient que des libellés d'options. */}
        {editorial && <EditorialSection editorial={editorial} />}
      </>
    )
  }

  const images = getImagesForVariant(pricedProduct, selectedVariantId)

  return (
    <>
      <JsonLd data={jsonLd} />
      <ProductTemplate
        product={pricedProduct}
        region={region}
        countryCode={params.countryCode}
        images={images ?? []}
      />
      {editorial && <EditorialSection editorial={editorial} />}
    </>
  )
}