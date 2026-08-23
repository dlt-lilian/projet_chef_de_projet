"use client"

import { Button, Heading } from "@modules/common/components/ui"

import CartTotals from "@modules/common/components/cart-totals"
import Divider from "@modules/common/components/divider"
import DiscountCode from "@modules/checkout/components/discount-code"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import { HttpTypes } from "@medusajs/types"

type SummaryProps = {
  cart: HttpTypes.StoreCart
  customer: HttpTypes.StoreCustomer | null
}

function getCheckoutStep(cart: HttpTypes.StoreCart) {
  if (!cart?.shipping_address?.address_1 || !cart.email) {
    return "address"
  } else if (cart?.shipping_methods?.length === 0) {
    return "delivery"
  } else {
    return "payment"
  }
}

const Summary = ({ cart, customer }: SummaryProps) => {
  const step = getCheckoutStep(cart)
  const checkoutHref = `/checkout?step=${step}`

  // Finaliser une commande exige un compte : sans session on passe par la
  // connexion, qui ramène au tunnel une fois connecté. La route /checkout
  // applique la même règle, ce lien n'est que le chemin confortable.
  const href = customer
    ? checkoutHref
    : `/account?redirect=${encodeURIComponent(checkoutHref)}`

  return (
    <div className="flex flex-col gap-y-4">
      <Heading level="h2" className="text-[2rem] leading-[2.75rem]">
        Récapitulatif
      </Heading>
      <DiscountCode cart={cart} />
      <Divider />
      <CartTotals totals={cart} />
      <LocalizedClientLink href={href} data-testid="checkout-button">
        <Button className="w-full h-10">Commander</Button>
      </LocalizedClientLink>
    </div>
  )
}

export default Summary
