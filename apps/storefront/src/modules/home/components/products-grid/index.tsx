import { listProducts } from "@lib/data/products"
import ProductCard from "@modules/products/components/product-preview"
import { getRegion } from "@lib/data/regions"
import { HttpTypes } from "@medusajs/types"

type ProductGridProps = {
  regionId: string
  countryCode: string
  collectionId?: string
  categoryId?: string[]
  productsIds?: string[]
  page?: number
  pageSize?: number
}

export default async function ProductGrid({
  regionId,
  countryCode,
  collectionId,
  categoryId,
  productsIds,
  page = 1,
  pageSize = 8,
}: ProductGridProps) {
  const region = await getRegion(countryCode)

  if (!region) {
    return null
  }

  const queryParams: Record<string, unknown> = {
    limit: pageSize,
    offset: (page - 1) * pageSize,
  }

  if (collectionId) queryParams.collection_id = [collectionId]
  if (categoryId) queryParams.category_id = categoryId
  if (productsIds) queryParams.id = productsIds

  const {
    response: { products },
  } = await listProducts({
    regionId,
    pageParam: page,
    queryParams,
  })

  if (!products || products.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <p className="text-gray-500 text-base">Aucun produit disponible.</p>
      </div>
    )
  }

  return (
    <section className="flex flex-col gap-6">
      <div className="flex items-end justify-between">
        <h2 className="text-2xl md:text-3xl font-semibold text-grey-90">
          Nos produits
        </h2>
      </div>
      <ul
        className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-5 md:gap-6 w-full"
        data-testid="product-grid"
      >
        {products.map((product: HttpTypes.StoreProduct) => (
          <li key={product.id}>
            <ProductCard product={product} region={region} />
          </li>
        ))}
      </ul>
    </section>
  )
}
