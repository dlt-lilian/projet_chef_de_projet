"use server"

import { sdk } from "@lib/config"
import { normalizeForSearch } from "@lib/util/search"
import { sortProducts } from "@lib/util/sort-products"
import { HttpTypes } from "@medusajs/types"
import { SortOptions } from "@modules/store/components/refinement-list/sort-products"
import { getAuthHeaders, getCacheOptions } from "./cookies"
import { getRegion, retrieveRegion } from "./regions"

export const listProducts = async ({
  pageParam = 1,
  queryParams,
  countryCode,
  regionId,
}: {
  pageParam?: number
  queryParams?: HttpTypes.FindParams & HttpTypes.StoreProductListParams
  countryCode?: string
  regionId?: string
}): Promise<{
  response: { products: HttpTypes.StoreProduct[]; count: number }
  nextPage: number | null
  queryParams?: HttpTypes.FindParams & HttpTypes.StoreProductListParams
}> => {
  if (!countryCode && !regionId) {
    throw new Error("Country code or region ID is required")
  }

  const limit = queryParams?.limit || 12
  const _pageParam = Math.max(pageParam, 1)
  const offset = _pageParam === 1 ? 0 : (_pageParam - 1) * limit

  let region: HttpTypes.StoreRegion | undefined | null

  if (countryCode) {
    region = await getRegion(countryCode)
  } else {
    region = await retrieveRegion(regionId!)
  }

  if (!region) {
    return {
      response: { products: [], count: 0 },
      nextPage: null,
    }
  }

  const headers = {
    ...(await getAuthHeaders()),
  }

  // `revalidate` OBLIGATOIRE, ne pas le retirer au profit des seuls tags :
  // ceux-ci sont nominatifs et rien côté admin ne les déclenche (cf. le détail
  // sur `getCacheOptions`, cookies.ts). Sans lui, une image ajoutée sur une
  // fiche produit n'apparaissait sur les cartes qu'au redéploiement suivant.
  // 60 s, comme le blog (lib/blog).
  const next = {
    ...(await getCacheOptions("products")),
    revalidate: 60,
  }

  return sdk.client
    .fetch<{ products: HttpTypes.StoreProduct[]; count: number }>(
      `/store/products`,
      {
        method: "GET",
        query: {
          limit,
          offset,
          region_id: region?.id,
          // `+categories.*` : alimente le niveau « catégorie » du fil d'Ariane
          // et de son JSON-LD sur les fiches produit. Deux champs par catégorie,
          // charge utile négligeable, et une seule source de vérité — le
          // rattachement réel en base, pas une table de correspondance figée
          // dans le code qui dériverait à la première modification en admin.
          fields:
            "*variants.calculated_price,+variants.inventory_quantity,*variants.images,+metadata,+tags,+categories.handle,+categories.name,",
          ...queryParams,
        },
        headers,
        // `cache` volontairement absent ici et sur les autres lectures de
        // catalogue : `next.revalidate` suffit à opter pour la mise en cache et
        // porte déjà la fenêtre de fraîcheur. Cumuler `cache: "force-cache"`
        // ferait doublon (Next 15 signale la contradiction) — même écriture que
        // `lib/blog`.
        next,
      }
    )
    .then(({ products, count }) => {
      const nextPage = count > offset + limit ? pageParam + 1 : null

      return {
        response: {
          products,
          count,
        },
        nextPage: nextPage,
        queryParams,
      }
    })
}

/**
 * Recherche produits insensible à la casse et aux accents.
 *
 * Le paramètre `q` de Medusa fait un `ILIKE` SQL : « eventail » n'y trouve pas
 * « Éventail ». Le catalogue est petit, on reprend donc le motif des articles
 * (`searchArticles`) : on charge les 100 premiers produits — même requête, donc
 * même entrée de cache, que `listProductsWithSort` sur /store — et on filtre en
 * mémoire. Au-delà de 100 produits, les suivants ne seraient plus cherchés :
 * il faudra alors passer par une route backend (extension `unaccent`).
 *
 * Les correspondances sur le titre passent devant celles trouvées seulement
 * dans le sous-titre, la description, les tags ou les catégories : le panneau
 * de suggestions n'en affiche que quatre.
 */
export const searchProducts = async ({
  query,
  countryCode,
  limit,
}: {
  query: string
  countryCode: string
  limit: number
}): Promise<HttpTypes.StoreProduct[]> => {
  const needle = normalizeForSearch(query.trim())
  if (!needle) return []

  const {
    response: { products },
  } = await listProducts({
    pageParam: 0,
    queryParams: { limit: 100 },
    countryCode,
  })

  const matches = (value?: string | null) =>
    !!value && normalizeForSearch(value).includes(needle)

  const titleMatches: HttpTypes.StoreProduct[] = []
  const otherMatches: HttpTypes.StoreProduct[] = []

  for (const product of products) {
    if (matches(product.title)) {
      titleMatches.push(product)
    } else if (
      [
        product.subtitle,
        product.description,
        ...(product.tags ?? []).map((tag) => tag.value),
        ...(product.categories ?? []).map((category) => category.name),
      ].some(matches)
    ) {
      otherMatches.push(product)
    }
  }

  return [...titleMatches, ...otherMatches].slice(0, limit)
}

/**
 * This will fetch 100 products to the Next.js cache and sort them based on the sortBy parameter.
 * It will then return the paginated products based on the page and limit parameters.
 */
export const listProductsWithSort = async ({
  page = 0,
  queryParams,
  sortBy = "created_at",
  countryCode,
}: {
  page?: number
  queryParams?: HttpTypes.FindParams & HttpTypes.StoreProductParams
  sortBy?: SortOptions
  countryCode: string
}): Promise<{
  response: { products: HttpTypes.StoreProduct[]; count: number }
  nextPage: number | null
  queryParams?: HttpTypes.FindParams & HttpTypes.StoreProductParams
}> => {
  const limit = queryParams?.limit || 12

  const {
    response: { products, count },
  } = await listProducts({
    pageParam: 0,
    queryParams: {
      ...queryParams,
      limit: 100,
    },
    countryCode,
  })

  const sortedProducts = sortProducts(products, sortBy)

  const pageParam = (page - 1) * limit

  const nextPage = count > pageParam + limit ? pageParam + limit : null

  const paginatedProducts = sortedProducts.slice(pageParam, pageParam + limit)

  return {
    response: {
      products: paginatedProducts,
      count,
    },
    nextPage,
    queryParams,
  }
}
