import { retrieveCart } from "@lib/data/cart"
import { retrieveCustomer } from "@lib/data/customer"
import { payloadFromCart } from "@lib/util/analytics-events"
import TrackEvent from "@modules/analytics/components/track-event"
import CartTemplate from "@modules/cart/templates"
import { Metadata } from "next"
import { notFound } from "next/navigation"

export const metadata: Metadata = {
  title: "Panier",
  description: "Votre panier Hinaso.",
  // Page transactionnelle et personnalisée → hors index Google.
  robots: { index: false, follow: false },
}

export default async function Cart() {
  const cart = await retrieveCart().catch((error) => {
    console.error(error)
    return notFound()
  })

  const customer = await retrieveCustomer()

  return (
    <>
      {/* Consultation du panier. Rien n'est émis sur un panier VIDE : GA4
          définit `view_cart` par les articles qu'il contient, et un panier sans
          ligne diluerait l'étape la plus regardée de l'entonnoir — celle qui
          précède immédiatement la commande. */}
      {cart?.items?.length ? (
        <TrackEvent
          event="view_cart"
          dedupeKey={cart.id}
          payload={payloadFromCart(cart)}
        />
      ) : null}
      <CartTemplate cart={cart} customer={customer} />
    </>
  )
}
