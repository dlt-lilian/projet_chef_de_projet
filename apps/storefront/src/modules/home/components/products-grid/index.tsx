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
                                            pageSize = 12,
                                          }: ProductGridProps) {
  const region = await getRegion(countryCode)

  if (!region) {
    return null
  }

  const {
    response: { products },
  } = await listProducts({
    regionId,
    collectionId,
    categoryId,
    productsIds,
    pageParam: page,
    queryParams: {
      limit: pageSize,
      offset: (page - 1) * pageSize,
    },
  })

  if (!products || products.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <p className="text-neutral-500 text-base">Aucun produit disponible.</p>
      </div>
    )
  }

  return (
    <div className="space-y-5">
      <h3 className="text-center text-2xl">Articles</h3>
      <ul
        className="grid grid-cols-2 gap-5 sm:grid-cols-3 md:grid-cols-4 w-full"
        data-testid="product-grid"
      >
        {products.map((product: HttpTypes.StoreProduct) => (
          <li key={product.id}>
            <ProductCard product={product} region={region} />
          </li>
        ))}
      </ul>
    </div>
  )
}