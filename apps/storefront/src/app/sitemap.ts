import { MetadataRoute } from "next"
import { absoluteUrl } from "@lib/util/seo"
import { sdk } from "@lib/config"
import { getAllArticles } from "@lib/blog"
import { HttpTypes } from "@medusajs/types"

// Les couches data lisent les cookies (tags de cache Medusa) → route dynamique,
// calculée à la requête. Évite tout conflit "static generation + cookies" au build.
export const dynamic = "force-dynamic"

/**
 * sitemap.xml natif (Next Metadata route) → servi sur /sitemap.xml.
 *
 * Multi-pays : une entrée par (pays × URL indexable). Les handles produits /
 * catégories / collections / slugs blog sont indépendants du pays → on ne les
 * récupère qu'UNE fois, puis on décline par `countryCode`.
 *
 * ⚠️ Données FRAÎCHES (`cache: "no-store"`) : on n'utilise PAS les helpers
 * `listCategories`/`listProducts`/… du site, qui sont en `force-cache` et
 * garderaient des entrées supprimées côté admin (ex. les catégories seed
 * `sweatshirts`…). Un sitemap doit refléter le catalogue réel, sinon Google
 * crawle des URLs 404. Le crawl du sitemap est rare → l'appel direct au backend
 * est négligeable.
 *
 * Exclus : compte, panier, checkout, commandes (privés/transactionnels, noindex).
 * Tout est piloté par `NEXT_PUBLIC_BASE_URL` via absoluteUrl().
 *
 * NB hreflang : pas d'alternates par pays ici (contenu actuellement uniforme en
 * français). À ajouter avec la matrice pays→langue lors du chantier i18n.
 */

const FRESH = { method: "GET" as const, cache: "no-store" as const }

async function fetchRegions(): Promise<HttpTypes.StoreRegion[]> {
  try {
    const { regions } = await sdk.client.fetch<{
      regions: HttpTypes.StoreRegion[]
    }>("/store/regions", FRESH)
    return regions ?? []
  } catch {
    return []
  }
}

async function fetchProducts(
  regionId?: string
): Promise<HttpTypes.StoreProduct[]> {
  try {
    const { products } = await sdk.client.fetch<{
      products: HttpTypes.StoreProduct[]
    }>("/store/products", {
      ...FRESH,
      query: { fields: "handle,updated_at", limit: 1000, region_id: regionId },
    })
    return products ?? []
  } catch {
    return []
  }
}

async function fetchCategories(): Promise<HttpTypes.StoreProductCategory[]> {
  try {
    const { product_categories } = await sdk.client.fetch<{
      product_categories: HttpTypes.StoreProductCategory[]
    }>("/store/product-categories", {
      ...FRESH,
      query: { fields: "handle,updated_at", limit: 1000 },
    })
    return product_categories ?? []
  } catch {
    return []
  }
}

async function fetchCollections(): Promise<HttpTypes.StoreCollection[]> {
  try {
    const { collections } = await sdk.client.fetch<{
      collections: HttpTypes.StoreCollection[]
    }>("/store/collections", {
      ...FRESH,
      query: { fields: "handle,updated_at", limit: 1000 },
    })
    return collections ?? []
  } catch {
    return []
  }
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const regions = await fetchRegions()
  const countries = Array.from(
    new Set(
      regions
        .flatMap((r) => r.countries?.map((c) => c.iso_2?.toLowerCase()) ?? [])
        .filter((c): c is string => Boolean(c))
    )
  )
  if (countries.length === 0) return []

  const [products, categories, collections, articles] = await Promise.all([
    fetchProducts(regions[0]?.id),
    fetchCategories(),
    fetchCollections(),
    getAllArticles().catch(() => []),
  ])

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
