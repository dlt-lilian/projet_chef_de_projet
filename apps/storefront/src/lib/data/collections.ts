"use server"

import { sdk } from "@lib/config"
import { HttpTypes } from "@medusajs/types"
import { getCacheOptions } from "./cookies"

export const retrieveCollection = async (id: string) => {
  // Fenêtre de revalidation obligatoire : les tags seuls ne rafraîchissent
  // jamais le catalogue (cf. `getCacheOptions`, cookies.ts). Sans elle, une
  // collection modifiée en admin n'apparaissait qu'au redéploiement suivant.
  const next = {
    ...(await getCacheOptions("collections")),
    revalidate: 60,
  }

  return await sdk.client
    .fetch<{ collection: HttpTypes.StoreCollection }>(
      `/store/collections/${id}`,
      {
        next,
      }
    )
    .then(({ collection }) => collection)
}

export const listCollections = async (
  queryParams: Record<string, string> = {}
): Promise<{ collections: HttpTypes.StoreCollection[]; count: number }> => {
  // Cf. `retrieveCollection` ci-dessus.
  const next = {
    ...(await getCacheOptions("collections")),
    revalidate: 60,
  }

  queryParams.limit = queryParams.limit || "100"
  queryParams.offset = queryParams.offset || "0"

  return await sdk.client
    .fetch<{ collections: HttpTypes.StoreCollection[]; count: number }>(
      "/store/collections",
      {
        query: queryParams,
        next,
      }
    )
    .then(({ collections }) => ({ collections, count: collections.length }))
}

export const getCollectionByHandle = async (
  handle: string
): Promise<HttpTypes.StoreCollection | null> => {
  // Cf. `retrieveCollection` ci-dessus.
  const next = {
    ...(await getCacheOptions("collections")),
    revalidate: 60,
  }

  return await sdk.client
    .fetch<HttpTypes.StoreCollectionListResponse>(`/store/collections`, {
      query: { handle, fields: "*products" },
      next,
    })
    .then(({ collections }) => collections[0] || null)
}
