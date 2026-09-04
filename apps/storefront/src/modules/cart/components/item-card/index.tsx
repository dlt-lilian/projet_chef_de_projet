"use client"

import { deleteLineItem, updateLineItem } from "@lib/data/cart"
import { HttpTypes } from "@medusajs/types"
import { Spinner, Trash } from "@medusajs/icons"
import ErrorMessage from "@modules/checkout/components/error-message"
import LineItemOptions from "@modules/common/components/line-item-options"
import LineItemPrice from "@modules/common/components/line-item-price"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import { Icon } from "@modules/common/components/my_ui/icon"
import Thumbnail from "@modules/products/components/thumbnail"
import { readConfiguratorLineOptions } from "@modules/configurator/lib/persistence"
import { useState } from "react"

// TODO: Update this to grab the actual max inventory
const MAX_QUANTITY = 10

type ItemCardProps = {
  item: HttpTypes.StoreCartLineItem
  currencyCode: string
}

/**
 * Ligne de panier en version « carte ». Le tableau du desktop (5 colonnes)
 * devient illisible sous 1024 px : on empile ici vignette + infos, et le
 * <select> de quantité est remplacé par un stepper tactile.
 */
const ItemCard = ({ item, currencyCode }: ItemCardProps) => {
  const [updating, setUpdating] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const changeQuantity = async (quantity: number) => {
    setError(null)
    setUpdating(true)

    await updateLineItem({ lineId: item.id, quantity })
      .catch((err) => {
        setError(err.message)
      })
      .finally(() => {
        setUpdating(false)
      })
  }

  const handleDelete = async () => {
    setDeleting(true)
    await deleteLineItem(item.id).catch(() => {
      setDeleting(false)
    })
  }

  // Article configuré (3D) → le lien rouvre la fiche AVEC sa configuration.
  const isConfigured = !!readConfiguratorLineOptions(item.metadata)
  const productHref = isConfigured
    ? `/products/${item.product_handle}?line=${item.id}`
    : `/products/${item.product_handle}`

  const busy = updating || deleting

  return (
    <li
      className="flex gap-4 border-b border-grey-20 pb-4 last:border-0 last:pb-0"
      data-testid="product-row"
    >
      <LocalizedClientLink href={productHref} className="shrink-0 w-24">
        <Thumbnail
          thumbnail={item.thumbnail}
          images={item.variant?.product?.images}
          size="square"
          alt={item.product_title}
        />
      </LocalizedClientLink>

      <div className="flex flex-col min-w-0 flex-1">
        <LocalizedClientLink href={productHref}>
          <p
            className="font-semibold text-grey-90 break-words"
            data-testid="product-title"
          >
            {item.product_title}
          </p>
        </LocalizedClientLink>

        <LineItemOptions
          variant={item.variant}
          metadata={item.metadata}
          data-testid="product-variant"
        />

        {/* LineItemPrice s'aligne à droite par défaut : le rendre inline-flex
            le fait retomber sur la largeur de son contenu, donc à gauche. */}
        <div className="flex mt-1">
          <LineItemPrice item={item} style="tight" currencyCode={currencyCode} />
        </div>

        <div className="flex items-center gap-2 mt-3">
          <div className="flex items-center gap-1 rounded-circle border border-grey-20 bg-white p-1">
            <button
              type="button"
              onClick={() => changeQuantity(item.quantity - 1)}
              disabled={busy || item.quantity <= 1}
              aria-label="Diminuer la quantité"
              data-testid="product-decrease-button"
              className="flex items-center justify-center w-7 h-7 rounded-circle bg-primary text-white hover:bg-primary-light disabled:opacity-40 transition-colors"
            >
              <Icon name="chevron-left" size={16} />
            </button>

            <span
              className="min-w-[1.5rem] text-center font-semibold text-grey-90"
              data-testid="product-quantity"
              data-value={item.quantity}
            >
              {updating ? <Spinner className="animate-spin mx-auto" /> : item.quantity}
            </span>

            <button
              type="button"
              onClick={() => changeQuantity(item.quantity + 1)}
              disabled={busy || item.quantity >= MAX_QUANTITY}
              aria-label="Augmenter la quantité"
              data-testid="product-increase-button"
              className="flex items-center justify-center w-7 h-7 rounded-circle bg-primary text-white hover:bg-primary-light disabled:opacity-40 transition-colors"
            >
              <Icon name="chevron-right" size={16} />
            </button>
          </div>

          <button
            type="button"
            onClick={handleDelete}
            disabled={busy}
            aria-label="Supprimer l'article"
            data-testid="product-delete-button"
            className="flex items-center justify-center w-9 h-9 rounded-rounded bg-red-500 text-white hover:bg-red-600 disabled:opacity-40 transition-colors"
          >
            {deleting ? <Spinner className="animate-spin" /> : <Trash />}
          </button>
        </div>

        <ErrorMessage error={error} data-testid="product-error-message" />
      </div>
    </li>
  )
}

export default ItemCard
