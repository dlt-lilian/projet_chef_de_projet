import "server-only"
import { HttpTypes } from "@medusajs/types"

import { fetchProductConfig } from "@lib/configurator"
import { getProductPrice } from "@lib/util/get-product-price"
import {
  getProductConfig,
  isConfigurableProduct,
} from "@modules/configurator/config/configurableProducts"
import {
  listVariantCombinations,
  VARIANT_PARAM,
  type VariantCombination,
} from "@modules/configurator/config/variantAxes"

/**
 * Éclatement des produits configurables en déclinaisons affichables.
 *
 * La boutique ne comptait que trois produits parce que chacun n'a qu'une seule
 * variante Medusa (« Standard ») : toute la richesse est dans le configurateur.
 * On la fait remonter ici — une carte par couleur × motif — sans rien changer
 * au catalogue Medusa : ces déclinaisons n'existent pas en base, elles sont
 * dérivées de la configuration au rendu.
 *
 * Conséquence assumée : le panier et les stocks continuent de ne connaître que
 * la variante « Standard » + le metadata de configuration. Une déclinaison
 * n'est qu'un point d'entrée pré-coché dans le configurateur.
 */

/**
 * Base des vignettes pré-générées (une par déclinaison, nommée `<clé>.png`).
 *
 * Tant que la variable n'est pas définie, les cartes retombent sur la miniature
 * du produit : la boutique reste correcte pendant que les rendus se génèrent.
 * Ne la renseigner qu'une fois les 96 images en ligne — une image manquante
 * s'afficherait cassée.
 */
const VARIANT_IMAGE_BASE = process.env.NEXT_PUBLIC_VARIANT_IMAGE_BASE_URL

function variantImageUrl(key: string): string | null {
  if (!VARIANT_IMAGE_BASE) {
    return null
  }
  return `${VARIANT_IMAGE_BASE.replace(/\/+$/, "")}/${key}.png`
}

export type ProductCard = {
  /** Clé stable : id produit, ou clé de déclinaison. */
  key: string
  href: string
  title: string
  /** Produit Medusa d'origine — pour la miniature de repli et l'alt. */
  product: HttpTypes.StoreProduct
  /** Vignette de la déclinaison si elle a été pré-générée. */
  imageUrl: string | null
  /** Prix en unités monétaires, supplément de la déclinaison compris. */
  amount: number | null
  currencyCode: string
  /** `null` pour un produit non configurable : la carte reste le produit nu. */
  combination: VariantCombination | null
}

function baseCard(product: HttpTypes.StoreProduct): ProductCard {
  const { cheapestPrice } = getProductPrice({ product })

  return {
    key: product.id,
    href: `/products/${product.handle}`,
    title: product.title,
    product,
    imageUrl: null,
    amount: cheapestPrice?.calculated_price_number ?? null,
    currencyCode: cheapestPrice?.currency_code ?? "eur",
    combination: null,
  }
}

/**
 * Développe une liste de produits en cartes.
 *
 * La config est relue depuis l'admin (avec repli sur la config statique), donc
 * ajouter une couleur en admin ajoute une carte en boutique sans redéploiement
 * — au rythme du cache de `fetchProductConfig`, soit 60 s.
 */
export async function listProductCards(
  products: HttpTypes.StoreProduct[]
): Promise<ProductCard[]> {
  const perProduct = await Promise.all(
    products.map(async (product): Promise<ProductCard[]> => {
      const base = baseCard(product)

      if (!isConfigurableProduct(product.handle)) {
        return [base]
      }

      const config =
        (await fetchProductConfig(product.handle)) ??
        getProductConfig(product.handle)

      const combinations = listVariantCombinations(product.handle, config)
      if (!combinations.length) {
        return [base]
      }

      return combinations.map((combination) => ({
        ...base,
        key: combination.key,
        href: `/products/${product.handle}?${VARIANT_PARAM}=${combination.param}`,
        title: `${product.title} — ${combination.label}`,
        imageUrl: variantImageUrl(combination.key),
        amount:
          base.amount === null
            ? null
            : // `priceDelta` est en centimes, `amount` en unités : même
              // conversion que le récapitulatif du configurateur.
              base.amount + combination.priceDelta / 100,
        combination,
      }))
    })
  )

  return perProduct.flat()
}
