import { MetadataRoute } from "next"
import { absoluteUrl } from "@lib/util/seo"
import { listRegions } from "@lib/data/regions"
import { listCategories } from "@lib/data/categories"
import { listCollections } from "@lib/data/collections"
import { listProducts } from "@lib/data/products"
import { getAllArticles } from "@lib/blog"

// Les couches data lisent les cookies (tags de cache Medusa) → route dynamique,
// calculée à la requête mais adossée au cache `fetch` (force-cache + tags).
// Évite tout conflit "static generation + cookies" au build.
export const dynamic = "force-dynamic"

/**
 * sitemap.xml natif (Next Metadata route) → servi sur /sitemap.xml.
 *
 * Multi-pays : une entrée par (pays × URL indexable). Les handles produits /
 * catégories / collections / slugs blog sont indépendants du pays → on ne les
 * récupère qu'UNE fois, puis on décline par `countryCode`.
 *
 * Exclus : compte, panier, checkout, commandes (privés/transactionnels, noindex).
 * Tout est piloté par `NEXT_PUBLIC_BASE_URL` via absoluteUrl().
 *
 * Résilience : chaque fetch est protégé — si le backend est injoignable, on
 * renvoie au pire les pages statiques par pays plutôt que de casser la route.
 *
 * NB hreflang : pas d'alternates par pays ici (contenu actuellement uniforme en
 * français). À ajouter avec la matrice pays→langue lors du chantier i18n.
 */

async function getCountryCodes(): Promise<string[]> {
  try {
    const regions = await listRegions()
    const codes = (regions ?? [])
      .flatMap((r) => r.countries?.map((c) => c.iso_2?.toLowerCase()) ?? [])
      .filter((c): c is string => Boolean(c))
    return Array.from(new Set(codes))
  } catch {
    return []
  }
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const countries = await getCountryCodes()
  if (countries.length === 0) return []

  const [products, categories, collections, articles] = await Promise.all([
    listProducts({
      countryCode: countries[0],
      queryParams: { limit: 1000, fields: "handle,updated_at" },
    })
      .then((r) => r.response.products)
      .catch(() => []),
    listCategories()
      .then((c) => c ?? [])
      .catch(() => []),
    listCollections({ fields: "handle,updated_at", limit: "1000" })
      .then((r) => r.collections)
      .catch(() => []),
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
