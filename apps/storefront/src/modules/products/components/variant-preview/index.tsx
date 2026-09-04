import LocalizedClientLink from "@modules/common/components/localized-client-link"
import { Text } from "@modules/common/components/ui"
import { convertToLocale } from "@lib/util/money"
import type { ProductCard } from "@lib/data/variant-cards"
import Thumbnail from "../thumbnail"

/**
 * Carte de boutique pour une déclinaison (couleur × motif) ou, à défaut, pour
 * un produit nu.
 *
 * La pastille de couleur n'est pas décorative : tant que les vignettes 3D ne
 * sont pas générées, toutes les cartes d'un même produit partagent la même
 * miniature, et c'est elle qui distingue une déclinaison de sa voisine. Elle
 * reste utile ensuite, comme rappel de l'axe choisi.
 */
export default function VariantPreview({ card }: { card: ProductCard }) {
  const { combination } = card

  const price =
    card.amount === null
      ? null
      : convertToLocale({
          amount: card.amount,
          currency_code: card.currencyCode,
        })

  return (
    <LocalizedClientLink href={card.href} className="group">
      <div data-testid="product-wrapper" className="flex flex-col gap-y-3">
        <div className="relative">
          <Thumbnail
            thumbnail={card.imageUrl ?? card.product.thumbnail}
            images={card.product.images}
            size="full"
            alt={card.title}
            className="w-full aspect-square object-cover rounded-xl"
          />

          {combination && (
            <div className="absolute bottom-3 left-3 flex items-center gap-2">
              <span
                aria-hidden
                className="h-5 w-5 rounded-full border border-white/70 shadow-sm bg-cover bg-center"
                style={
                  combination.color.colorHex
                    ? { backgroundColor: combination.color.colorHex }
                    : combination.color.texturePath
                      ? { backgroundImage: `url(${combination.color.texturePath})` }
                      : undefined
                }
              />
              {combination.motif?.texturePath && (
                <span className="rounded-full bg-white/85 px-2 py-0.5 text-xs text-grey-90">
                  {combination.motif.label}
                </span>
              )}
            </div>
          )}
        </div>

        <p className="text-2xl text-center" data-testid="product-title">
          {card.title}
        </p>

        <div className="text-center">
          {price && (
            <Text className="text-ui-fg-muted" data-testid="price">
              {price}
            </Text>
          )}
        </div>
      </div>
    </LocalizedClientLink>
  )
}
