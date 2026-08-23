"use server"

import { searchArticles } from "@lib/blog"
import { listProducts } from "@lib/data/products"
import { getProductPrice } from "@lib/util/get-product-price"

import type { SearchSuggestions } from "./types"

/** Nombre d'éléments affichés par section dans le panneau. */
const SUGGESTION_LIMIT = 4

/**
 * Recherche vive appelée par le champ de la navbar à chaque frappe (débattue
 * côté client). Les deux sources sont interrogées en parallèle et une source en
 * échec ne doit pas vider l'autre : le panneau reste utile même si le blog ou
 * le catalogue ne répond pas.
 */
export async function searchSuggestions(
  query: string,
  countryCode: string
): Promise<SearchSuggestions> {
  const trimmedQuery = query.trim()

  if (!trimmedQuery) {
    return { products: [], articles: [] }
  }

  const [products, articles] = await Promise.all([
    listProducts({
      countryCode,
      queryParams: { q: trimmedQuery, limit: SUGGESTION_LIMIT },
    })
      .then(({ response }) => response.products)
      .catch(() => []),
    searchArticles(trimmedQuery).catch(() => []),
  ])

  return {
    products: products.map((product) => ({
      id: product.id,
      title: product.title,
      handle: product.handle ?? "",
      thumbnail: product.thumbnail ?? null,
      price:
        getProductPrice({ product }).cheapestPrice?.calculated_price ?? null,
    })),
    articles: articles.slice(0, SUGGESTION_LIMIT).map((article) => ({
      id: article.id,
      title: article.title,
      slug: article.slug,
      category: article.category,
    })),
  }
}
