import "server-only"
import { cookies as nextCookies } from "next/headers"

export const getAuthHeaders = async (): Promise<
  { authorization: string } | Record<string, never>
> => {
  try {
    const cookies = await nextCookies()
    const token = cookies.get("_medusa_jwt")?.value

    if (!token) {
      return {}
    }

    return { authorization: `Bearer ${token}` }
  } catch {
    return {}
  }
}

export const getCacheTag = async (tag: string): Promise<string> => {
  try {
    const cookies = await nextCookies()
    const cacheId = cookies.get("_medusa_cache_id")?.value

    if (!cacheId) {
      return ""
    }

    return `${tag}-${cacheId}`
  } catch {
    return ""
  }
}

/**
 * Tags de cache Next pour un fetch Medusa.
 *
 * ⚠️ Ces tags NE SUFFISENT PAS à rafraîchir le catalogue : tout appelant qui
 * lit du contenu piloté depuis l'admin (produits, catégories, collections,
 * régions) DOIT aussi poser son propre `next.revalidate`.
 *
 * Deux raisons :
 *
 * 1. Le tag renvoyé vaut `<tag>-<cacheId>`, où `cacheId` est le cookie
 *    `_medusa_cache_id` — un UUID tiré PAR VISITEUR dans le middleware. Il
 *    n'est donc revalidable que depuis une action de ce visiteur précis, et
 *    rien côté admin Medusa ne le déclenche : il n'existe ni route
 *    `/api/revalidate` ni subscriber `product.updated`.
 * 2. Sans cookie (premier rendu, crawler), on renvoie `{}` : l'entrée est
 *    alors mise en cache SANS AUCUN TAG, donc strictement impossible à
 *    invalider.
 *
 * Sur Railway (`next start`, cache disque persistant), une réponse sans
 * fenêtre de revalidation reste figée pour toute la durée de vie du conteneur
 * — jusqu'au redéploiement suivant.
 *
 * Les données propres au visiteur (panier, client, commandes) échappent à ça :
 * leurs mutations appellent `revalidateTag` avec le `cacheId` de l'utilisateur
 * en cours. Pour elles, les tags seuls sont la bonne réponse.
 */
export const getCacheOptions = async (
  tag: string
): Promise<{ tags: string[] } | Record<string, never>> => {
  if (typeof window !== "undefined") {
    return {}
  }

  const cacheTag = await getCacheTag(tag)

  if (!cacheTag) {
    return {}
  }

  return { tags: [`${cacheTag}`] }
}

export const setAuthToken = async (token: string) => {
  const cookies = await nextCookies()
  cookies.set("_medusa_jwt", token, {
    maxAge: 60 * 60 * 24 * 7,
    httpOnly: true,
    sameSite: "strict",
    secure: process.env.NODE_ENV === "production",
  })
}

export const removeAuthToken = async () => {
  const cookies = await nextCookies()
  cookies.set("_medusa_jwt", "", {
    maxAge: -1,
  })
}

export const getCartId = async () => {
  const cookies = await nextCookies()
  return cookies.get("_medusa_cart_id")?.value
}

export const setCartId = async (cartId: string) => {
  const cookies = await nextCookies()
  cookies.set("_medusa_cart_id", cartId, {
    maxAge: 60 * 60 * 24 * 7,
    httpOnly: true,
    sameSite: "strict",
    secure: process.env.NODE_ENV === "production",
  })
}

export const removeCartId = async () => {
  const cookies = await nextCookies()
  cookies.set("_medusa_cart_id", "", {
    maxAge: -1,
  })
}
