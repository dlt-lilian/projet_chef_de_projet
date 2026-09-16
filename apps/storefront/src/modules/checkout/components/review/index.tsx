"use client"

import { Heading, Text, clx } from "@modules/common/components/ui"

import PaymentButton from "../payment-button"
import { useSearchParams } from "next/navigation"
import { HttpTypes } from "@medusajs/types"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import { useState } from "react"

const Review = ({ cart }: { cart: HttpTypes.StoreCart }) => {
  const searchParams = useSearchParams()

  const isOpen = searchParams.get("step") === "review"

  // Acceptation expresse des CGV, décochée par défaut : une case pré-cochée ou
  // une simple mention « en cliquant, vous acceptez » ne vaut pas acceptation.
  const [termsAccepted, setTermsAccepted] = useState(false)

  const paidByGiftcard = !!(
    (cart as unknown as Record<string, unknown>)?.gift_cards && ((cart as unknown as Record<string, unknown>)?.gift_cards as unknown[])?.length > 0 && cart?.total === 0
  )

  const previousStepsCompleted =
    cart.shipping_address &&
    (cart.shipping_methods?.length ?? 0) > 0 &&
    (cart.payment_collection || paidByGiftcard)

  return (
    <div className="bg-white">
      <div className="flex flex-row items-center justify-between mb-6">
        <Heading
          level="h2"
          className={clx(
            "flex flex-row text-3xl-regular gap-x-2 items-baseline",
            {
              "opacity-50 pointer-events-none select-none": !isOpen,
            }
          )}
        >
          Récapitulatif
        </Heading>
      </div>
      {isOpen && previousStepsCompleted && (
        <>
          <div className="flex items-start gap-x-3 w-full mb-6">
            <input
              id="accept-cgv"
              type="checkbox"
              checked={termsAccepted}
              onChange={(e) => setTermsAccepted(e.target.checked)}
              className="mt-1 h-4 w-4 shrink-0 rounded border-gray-300 text-gray-900 focus:ring-gray-900"
              data-testid="accept-cgv-checkbox"
            />
            <label htmlFor="accept-cgv">
              <Text as="span" className="txt-medium-plus text-ui-fg-base">
                J&apos;ai lu et j&apos;accepte les{" "}
                <LocalizedClientLink
                  href="/cgv"
                  target="_blank"
                  rel="noopener"
                  className="underline"
                >
                  Conditions générales de vente
                </LocalizedClientLink>
                , et reconnais avoir pris connaissance de la{" "}
                <LocalizedClientLink
                  href="/politique-de-confidentialite"
                  target="_blank"
                  rel="noopener"
                  className="underline"
                >
                  Politique de confidentialité
                </LocalizedClientLink>
                .
              </Text>
            </label>
          </div>
          <PaymentButton
            cart={cart}
            termsAccepted={termsAccepted}
            data-testid="submit-order-button"
          />
        </>
      )}
    </div>
  )
}

export default Review
