import { listProducts } from "@lib/data/products"
import { getRegion } from "@lib/data/regions"
import { listProductCards } from "@lib/data/variant-cards"
import { sortProducts } from "@lib/util/sort-products"
import VariantPreview from "@modules/products/components/variant-preview"
import { Pagination } from "@modules/store/components/pagination"
import { SortOptions } from "@modules/store/components/refinement-list/sort-products"

const PRODUCT_LIMIT = 12

/**
 * Plafond de produits rapatriés avant éclatement en déclinaisons.
 *
 * La pagination ne peut plus être déléguée au backend : une page de boutique
 * compte des déclinaisons, pas des produits, et le backend ne les connaît pas.
 * On récupère donc tout le catalogue (trois produits aujourd'hui, la limite
 * couvre large) et on pagine sur les cartes obtenues.
 */
const CATALOGUE_LIMIT = 100

type PaginatedProductsParams = {
  limit: number
  collection_id?: string[]
  category_id?: string[]
  id?: string[]
  order?: string
}

export default async function PaginatedProducts({
  sortBy,
  page,
  collectionId,
  categoryId,
  productsIds,
  countryCode,
}: {
  sortBy?: SortOptions
  page: number
  collectionId?: string
  categoryId?: string
  productsIds?: string[]
  countryCode: string
}) {
  const queryParams: PaginatedProductsParams = {
    limit: CATALOGUE_LIMIT,
  }

  if (collectionId) {
    queryParams["collection_id"] = [collectionId]
  }

  if (categoryId) {
    queryParams["category_id"] = [categoryId]
  }

  if (productsIds) {
    queryParams["id"] = productsIds
  }

  if (sortBy === "created_at") {
    queryParams["order"] = "created_at"
  }

  const region = await getRegion(countryCode)

  if (!region) {
    return null
  }

  const {
    response: { products },
  } = await listProducts({
    pageParam: 1,
    queryParams,
    countryCode,
  })

  const sort = sortBy || "created_at"
  const cards = await listProductCards(sortProducts(products, sort))

  // Tri final sur les cartes : deux déclinaisons d'un même produit peuvent
  // avoir des prix différents (un motif est facturé), un tri par prix qui
  // s'arrêterait au produit les laisserait dans le désordre.
  if (sort === "price_asc" || sort === "price_desc") {
    cards.sort((a, b) => {
      const left = a.amount ?? Infinity
      const right = b.amount ?? Infinity
      return sort === "price_asc" ? left - right : right - left
    })
  }

  const totalPages = Math.ceil(cards.length / PRODUCT_LIMIT)
  const start = (Math.max(page, 1) - 1) * PRODUCT_LIMIT
  const pageCards = cards.slice(start, start + PRODUCT_LIMIT)

  return (
    <>
      <ul
        className="grid grid-cols-2 w-full small:grid-cols-3 medium:grid-cols-4 gap-x-6 gap-y-8"
        data-testid="products-list"
      >
        {pageCards.map((card) => (
          <li key={card.key}>
            <VariantPreview card={card} />
          </li>
        ))}
      </ul>
      {totalPages > 1 && (
        <Pagination
          data-testid="product-pagination"
          page={page}
          totalPages={totalPages}
        />
      )}
    </>
  )
}
