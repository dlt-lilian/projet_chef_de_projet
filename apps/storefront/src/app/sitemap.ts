import { MetadataRoute } from "next"
import { HttpTypes } from "@medusajs/types"
import { absoluteUrl } from "@lib/util/seo"
import { getAllArticles } from "@lib/blog"

/**
 * sitemap.xml natif (Next Metadata route) → servi sur /sitemap.xml.
 *
 * Généré à la REQUÊTE (`force-dynamic`), jamais prérendu au build. Pourquoi :
 * sur Railway, le conteneur de BUILD n'atteint pas de façon fiable le backend →
 * un sitemap statique/ISR se figeait VIDE au build (et servait ce vide jusqu'à
 * la revalidation). Au runtime, le backend est joignable → données correctes.
 *
 * Anti-« vide » au cold-boot : le backend Railway boote lentement après un
 * deploy (502 transitoires). `fetchStore` réessaie quelques fois avant
 * d'abandonner, ce qui couvre cette fenêtre. Le crawl d'un sitemap est rare →
 * l'appel direct à chaque requête est négligeable.
 *
 * Données FRAÎCHES (`no-store`, `fetch` NATIF — pas le SDK, qui lit les cookies) :
 * reflète le catalogue réel, donc un item supprimé en admin (ex. catégorie seed
 * `sweatshirts`) disparaît immédiatement, sans redeploy.
 *
 * Multi-pays : une entrée par (pays × URL indexable). Exclus : compte, panier,
 * checkout, commandes (privés, noindex). URLs pilotées par NEXT_PUBLIC_BASE_URL.
 *
 * NB hreflang : pas d'alternates par pays ici (contenu uniforme FR pour l'instant).
 */

export const dynamic = "force-dynamic"

const BACKEND_URL = (
  process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL ?? "http://localhost:9000"
).replace(/\/+$/, "")
const PUBLISHABLE_KEY = process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY ?? ""

async function fetchStore<T>(path: string, attempts = 3): Promise<T | null> {
  for (let attempt = 1; attempt <= attempts; attempt++) {
    try {
      const res = await fetch(`${BACKEND_URL}${path}`, {
        headers: { "x-publishable-api-key": PUBLISHABLE_KEY },
        cache: "no-store",
      })
      if (res.ok) return (await res.json()) as T
    } catch {
      // réseau / backend en cold-boot → on réessaie
    }
    if (attempt < attempts) {
      await new Promise((r) => setTimeout(r, 600 * attempt))
    }
  }
  return null
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
