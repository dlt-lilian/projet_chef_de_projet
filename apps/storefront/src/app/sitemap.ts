import { MetadataRoute } from "next"
import { HttpTypes } from "@medusajs/types"
import { absoluteUrl } from "@lib/util/seo"
import { getAllArticles } from "@lib/blog"

/**
 * sitemap.xml natif (Next Metadata route) → servi sur /sitemap.xml.
 *
 * Stratégie de cache = ISR (revalidation temporelle), le bon compromis :
 *  - `force-cache` gardait un catalogue figé (catégories seed supprimées mais
 *    toujours listées) tant qu'on ne redéployait pas → périmé.
 *  - `no-store` refaisait un appel live à CHAQUE requête, sans filet → sitemap
 *    VIDE en cas de blip backend (ex. boot lent juste après un deploy).
 *  - ISR : servi depuis le cache (jamais vide), régénéré au plus toutes les
 *    heures → reflète les changements admin sans redeploy, et absorbe les blips.
 *
 * On tape le backend en `fetch` NATIF (pas le SDK Medusa) : le SDK lit les
 * cookies (locale) → forcerait un rendu dynamique et empêcherait l'ISR.
 *
 * Multi-pays : une entrée par (pays × URL indexable). Handles produits /
 * catégories / collections / slugs blog récupérés une fois, déclinés par pays.
 * Exclus : compte, panier, checkout, commandes (privés, noindex).
 * URLs pilotées par `NEXT_PUBLIC_BASE_URL` via absoluteUrl().
 *
 * NB hreflang : pas d'alternates par pays ici (contenu uniforme FR pour l'instant).
 */

// 1 h — ajustable (ex. 600 pour 10 min). Next impose un littéral pour ce champ
// de config de route (pas de référence à une const).
export const revalidate = 3600

const BACKEND_URL = (
  process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL ?? "http://localhost:9000"
).replace(/\/+$/, "")
const PUBLISHABLE_KEY = process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY ?? ""

async function fetchStore<T>(path: string): Promise<T | null> {
  try {
    const res = await fetch(`${BACKEND_URL}${path}`, {
      headers: { "x-publishable-api-key": PUBLISHABLE_KEY },
      next: { revalidate },
    })
    if (!res.ok) return null
    return (await res.json()) as T
  } catch {
    return null
  }
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const regionsData = await fetchStore<{ regions: HttpTypes.StoreRegion[] }>(
    "/store/regions"
  )
  const regions = regionsData?.regions ?? []
  const countries = Array.from(
    new Set(
      regions
        .flatMap((r) => r.countries?.map((c) => c.iso_2?.toLowerCase()) ?? [])
        .filter((c): c is string => Boolean(c))
    )
  )
  if (countries.length === 0) return []

  const regionId = regions[0]?.id

  const [productsData, categoriesData, collectionsData, articles] =
    await Promise.all([
      fetchStore<{ products: HttpTypes.StoreProduct[] }>(
        `/store/products?fields=handle,updated_at&limit=1000&region_id=${regionId}`
      ),
      fetchStore<{ product_categories: HttpTypes.StoreProductCategory[] }>(
        `/store/product-categories?fields=handle,updated_at&limit=1000`
      ),
      fetchStore<{ collections: HttpTypes.StoreCollection[] }>(
        `/store/collections?fields=handle,updated_at&limit=1000`
      ),
      getAllArticles().catch(() => []),
    ])

  const products = productsData?.products ?? []
  const categories = categoriesData?.product_categories ?? []
  const collections = collectionsData?.collections ?? []

  const now = new Date()
  const toDate = (v?: string | null) => (v ? new Date(v) : now)
  const entries: MetadataRoute.Sitemap = []

  for (const cc of countries) {
    // Pages statiques indexables
    entries.push(
      {
        url: absoluteUrl(`/${cc}`),
        lastModified: now,
        changeFrequency: "daily",
        priority: 1,
      },
      {
        url: absoluteUrl(`/${cc}/store`),
        lastModified: now,
        changeFrequency: "weekly",
        priority: 0.8,
      },
      {
        url: absoluteUrl(`/${cc}/blog`),
        lastModified: now,
        changeFrequency: "weekly",
        priority: 0.5,
      },
      {
        url: absoluteUrl(`/${cc}/contact`),
        lastModified: now,
        changeFrequency: "yearly",
        priority: 0.3,
      }
    )

    for (const p of products) {
      if (!p.handle) continue
      entries.push({
        url: absoluteUrl(`/${cc}/products/${p.handle}`),
        lastModified: toDate(p.updated_at),
        changeFrequency: "weekly",
        priority: 0.8,
      })
    }

    for (const c of categories) {
      if (!c.handle) continue
      entries.push({
        url: absoluteUrl(`/${cc}/categories/${c.handle}`),
        lastModified: toDate(c.updated_at),
        changeFrequency: "weekly",
        priority: 0.7,
      })
    }

    for (const col of collections) {
      if (!col.handle) continue
      entries.push({
        url: absoluteUrl(`/${cc}/collections/${col.handle}`),
        lastModified: toDate(col.updated_at),
        changeFrequency: "weekly",
        priority: 0.7,
      })
    }

    for (const a of articles) {
      if (!a.slug) continue
      entries.push({
        url: absoluteUrl(`/${cc}/blog/${a.slug}`),
        lastModified: toDate(a.updated_at),
        changeFrequency: "monthly",
        priority: 0.6,
      })
    }
  }

  return entries
}
