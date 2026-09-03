"use server"

import { sdk } from "@lib/config"
import { HttpTypes } from "@medusajs/types"

import { getAuthHeaders, getCacheOptions } from "./cookies"

export const retrieveVariant = async (
  variant_id: string
): Promise<HttpTypes.StoreProductVariant | null> => {
  const authHeaders = await getAuthHeaders()

  if (!authHeaders) return null

  const headers = {
    ...authHeaders,
  }

  // Fenêtre de revalidation obligatoire : les tags seuls ne rafraîchissent
  // jamais le catalogue (cf. `getCacheOptions`, cookies.ts). Aligné sur
  // `listProducts`, dont cette lecture est le pendant à l'échelle variante.
  const next = {
    ...(await getCacheOptions("variants")),
    revalidate: 60,
  }

  return await sdk.client
    .fetch<{ variant: HttpTypes.StoreProductVariant }>(
      `/store/product-variants/${variant_id}`,
      {
        method: "GET",
        query: {
          fields: "*images",
        },
        headers,
        next,
      }
    )
    .then(({ variant }) => variant)
    .catch(() => null)
}
