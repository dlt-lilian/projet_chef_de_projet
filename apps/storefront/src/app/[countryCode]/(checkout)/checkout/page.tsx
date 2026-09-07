import { retrieveCart } from "@lib/data/cart"
import { retrieveCustomer } from "@lib/data/customer"
import { payloadFromCart } from "@lib/util/analytics-events"
import TrackEvent from "@modules/analytics/components/track-event"
import PaymentWrapper from "@modules/checkout/components/payment-wrapper"
import CheckoutForm from "@modules/checkout/templates/checkout-form"
import CheckoutSummary from "@modules/checkout/templates/checkout-summary"
import { Metadata } from "next"
import { notFound, redirect } from "next/navigation"

export const metadata: Metadata = {
  title: "Commande",
}

export default async function Checkout(props: {
  params: Promise<{ countryCode: string }>
  searchParams: Promise<{ step?: string }>
}) {
  const { countryCode } = await props.params
  const { step } = await props.searchParams

  const cart = await retrieveCart()

  if (!cart) {
    return notFound()
  }

  const customer = await retrieveCustomer()

  // La règle vit ici et pas seulement sur le bouton du panier : sinon taper
  // l'URL du tunnel suffirait à commander sans compte.
  if (!customer) {
    const target = step ? `/checkout?step=${step}` : "/checkout"
    redirect(`/${countryCode}/account?redirect=${encodeURIComponent(target)}`)
  }

  return (
    <div className="grid grid-cols-1 small:grid-cols-[1fr_416px] content-container gap-x-40 py-12">
      {/* Entrée dans le tunnel. `dedupeKey` porte l'identifiant du panier et
          non l'étape : passer de l'adresse au paiement reste la MÊME commande
          en cours, et ne doit pas rouvrir un second tunnel — ce qui écraserait
          le taux d'abandon en le divisant sur trois entrées fictives. */}
      <TrackEvent
        event="begin_checkout"
        dedupeKey={cart.id}
        payload={payloadFromCart(cart)}
      />
      <PaymentWrapper cart={cart}>
        <CheckoutForm cart={cart} customer={customer} />
      </PaymentWrapper>
      <CheckoutSummary cart={cart} />
    </div>
  )
}
