import type { BlogPost, BlogPostPreview } from "./types"

/**
 * URL de base du backend Medusa.
 * En prod → variable d'env NEXT_PUBLIC_MEDUSA_BACKEND_URL
 */
const BACKEND_URL =
  process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL ?? "http://localhost:9000"

const BASE = `${BACKEND_URL}/store/blogs`

/** Headers communs (publishable API key Medusa) */
function headers() {
  return {
    "Content-Type": "application/json",
    "x-publishable-api-key":
      process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY ?? "",
  }
}

// ─────────────────────────────────────────────────────────────────────────────

/**
 * Liste tous les articles publiés (sans blocs).
 * Utilisé par la page /blog et l'ArticleGrid.
 */
export async function getAllArticles(options?: {
  category?: string
}): Promise<BlogPostPreview[]> {
  const url = new URL(BASE)
  url.searchParams.set("fields", "meta")
  if (options?.category) url.searchParams.set("category", options.category)

  try {
    const res = await fetch(url.toString(), {
      headers: headers(),
      // Revalide toutes les 60 secondes (ISR) — ajuste selon ta fréquence de publication
      next: { revalidate: 60 },
    })

    if (!res.ok) return []
    const { blogs } = await res.json()
    return blogs as BlogPostPreview[]
  } catch (err) {
    console.error(`[blog] getAllArticles a échoué (${BASE}) :`, err)
    return []
  }
}

/**
 * Article complet par slug (avec blocs).
 * Utilisé par la page /blog/[slug].
 */
export async function getArticleBySlug(slug: string): Promise<BlogPost | null> {
  try {
    const res = await fetch(`${BASE}/${slug}`, {
      headers: headers(),
      next: { revalidate: 60 },
    })

    if (res.status === 404) return null
    if (!res.ok) return null

    const { blog } = await res.json()
    if (!blog) return null

    return { ...blog, blocks: normalizeBlocks(blog.blocks) } as BlogPost
  } catch (err) {
    console.error(`[blog] getArticleBySlug("${slug}") a échoué (${BASE}) :`, err)
    return null
  }
}

/**
 * Garantit que `blocks` est toujours un tableau.
 * Le backend peut stocker `{}` (création sans blocs) ou `null`, et un JSONB
 * mal encodé peut revenir sous forme de chaîne — tous ces cas feraient planter
 * le rendu (`blocks.map` n'existe pas sur un objet/null/string).
 */
function normalizeBlocks(blocks: unknown): BlogPost["blocks"] {
  if (Array.isArray(blocks)) return blocks as BlogPost["blocks"]
  if (typeof blocks === "string") {
    try {
      const parsed = JSON.parse(blocks)
      return Array.isArray(parsed) ? parsed : []
    } catch {
      return []
    }
  }
  return []
}

/**
 * N derniers articles publiés — pour l'ArticleGrid de la homepage.
 */
export async function getLatestArticles(count = 3): Promise<BlogPostPreview[]> {
  const all = await getAllArticles()
  return all.slice(0, count)
}

/**
 * Toutes les catégories uniques.
 */
export async function getAllCategories(): Promise<string[]> {
  const res = await fetch(`${BASE}/categories`, {
    headers: headers(),
    next: { revalidate: 300 },
  })
  if (!res.ok) return []
  const { categories } = await res.json()
  return categories as string[]
}

/**
 * Pour generateStaticParams de Next.js.
 */
export async function getAllSlugs(): Promise<{ slug: string }[]> {
  const articles = await getAllArticles()
  return articles.map((a) => ({ slug: a.slug }))
}
