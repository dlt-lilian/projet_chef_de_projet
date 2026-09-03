"use server"

import { sdk } from "@lib/config"
import { HttpTypes } from "@medusajs/types"
import { getCacheOptions } from "./cookies"

export const listRegions = async () => {
  // Fenêtre de revalidation obligatoire : les tags seuls ne rafraîchissent
  // jamais ces données (cf. `getCacheOptions`, cookies.ts).
  //
  // 3600 s et non 60 s comme le reste du catalogue : le middleware interroge
  // déjà `/store/regions` avec `revalidate: 3600`, doublé de son propre cache
  // mémoire à TTL 1 h (`regionMapCache`). Descendre ici ne rendrait pas un
  // changement de région visible plus tôt — le middleware resterait la borne
  // basse — et ferait diverger deux lectures du même endpoint.
  const next = {
    ...(await getCacheOptions("regions")),
    revalidate: 3600,
  }

  return await sdk.client
    .fetch<{ regions: HttpTypes.StoreRegion[] }>(`/store/regions`, {
      method: "GET",
      next,
    })
    .then(({ regions }) => regions)
}

export const retrieveRegion = async (id: string) => {
  // Cf. `listRegions` ci-dessus.
  const next = {
    ...(await getCacheOptions(["regions", id].join("-"))),
    revalidate: 3600,
  }

  return await sdk.client
    .fetch<{ region: HttpTypes.StoreRegion }>(`/store/regions/${id}`, {
      method: "GET",
      next,
    })
    .then(({ region }) => region)
}

const regionMap = new Map<string, HttpTypes.StoreRegion>()

export const getRegion = async (countryCode: string) => {
  if (regionMap.has(countryCode)) {
    return regionMap.get(countryCode)
  }

  const regions = await listRegions()

  if (!regions) {
    return null
  }

  regions.forEach((region) => {
    region.countries?.forEach((c) => {
      regionMap.set(c?.iso_2 ?? "", region)
    })
  })

  const region = countryCode
    ? regionMap.get(countryCode)
    : regionMap.get("us")

  return region
}
