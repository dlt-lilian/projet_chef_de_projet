import { deleteLineItem } from "@lib/data/cart"
import { payloadFromLine, trackEcommerce } from "@lib/util/analytics-events"
import { Spinner, Trash } from "@medusajs/icons"
import { HttpTypes } from "@medusajs/types"
import { clx } from "@modules/common/components/ui"
import { useState } from "react"

/**
 * Retrait d'une ligne du panier (tableau du panier et menu déroulant d'en-tête).
 *
 * Le composant reçoit la LIGNE entière, et non son seul identifiant : GA4 veut
 * savoir ce qui a été retiré — l'article, son prix, sa quantité — et ces données
 * disparaissent avec la ligne. Les relire après coup est impossible.
 */
const DeleteButton = ({
  item,
  currencyCode,
  children,
  className,
}: {
  item: HttpTypes.StoreCartLineItem
  currencyCode?: string
  children?: React.ReactNode
  className?: string
}) => {
  const [isDeleting, setIsDeleting] = useState(false)

  const handleDelete = async () => {
    setIsDeleting(true)

    await deleteLineItem(item.id)
      .then(() => {
        // Après le retrait effectif : un échec (ligne déjà supprimée dans un
        // autre onglet, panier expiré) ne doit pas se comptabiliser.
        trackEcommerce(
          "remove_from_cart",
          payloadFromLine(item, item.quantity, currencyCode)
        )
      })
      .catch((_err) => {
        setIsDeleting(false)
      })
  }

  return (
    <div
      className={clx(
        "flex items-center justify-between text-small-regular",
        className
      )}
    >
      <button
        className="flex gap-x-1 text-ui-fg-subtle hover:text-ui-fg-base cursor-pointer"
        onClick={handleDelete}
      >
        {isDeleting ? <Spinner className="animate-spin" /> : <Trash />}
        <span>{children}</span>
      </button>
    </div>
  )
}

export default DeleteButton
