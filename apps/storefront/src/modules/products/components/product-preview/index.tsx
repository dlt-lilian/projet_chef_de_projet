import { getProductPrice } from "@lib/util/get-product-price"
import { HttpTypes } from "@medusajs/types"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import Thumbnail from "../thumbnail"
import PreviewPrice from "./price"
import { Button } from "@modules/common/components/ui"

export default async function ProductPreview({
                                               product,
                                               isFeatured,
                                               region: _region,
                                             }: {
  product: HttpTypes.StoreProduct
  isFeatured?: boolean
  region: HttpTypes.StoreRegion
}) {
  const { cheapestPrice } = getProductPrice({
    product,
  })

  return (
    <LocalizedClientLink href={`/products/${product.handle}`} className="group">
      <div data-testid="product-wrapper" className="flex flex-col gap-y-3">

        {/* Image */}
        <Thumbnail
          thumbnail={product.thumbnail}
          images={product.images}
          size="full"
          isFeatured={isFeatured}
          className="w-full aspect-square object-cover rounded-xl"
        />

        {/* Titre */}
        <p
          className="text-2xl text-center"
          data-testid="product-title"
        >
          {product.title}
        </p>

        {/* Prix */}
        <div className="text-center">
          {cheapestPrice && <PreviewPrice price={cheapestPrice} />}
        </div>
      </div>
    </LocalizedClientLink>
  )
}