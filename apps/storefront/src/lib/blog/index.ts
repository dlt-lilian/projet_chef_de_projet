import fs from "fs"
import path from "path"
import type { Article, ArticlePreview } from "./types"

// Les fichiers JSON sont dans src/data/blogs/
const BLOGS_DIR = path.join(process.cwd(), "src", "data", "blogs")

/**
 * Retourne la liste de tous les articles (sans les blocs).
 * Triés du plus récent au plus ancien.
 */
export function getAllArticles(): ArticlePreview[] {
  const files = fs.readdirSync(BLOGS_DIR).filter((f) => f.endsWith(".json"))

  const articles: ArticlePreview[] = files.map((file) => {
    const raw = fs.readFileSync(path.join(BLOGS_DIR, file), "utf-8")
    const { slug, meta } = JSON.parse(raw)
    return { slug, meta }
  })

  const sorted = articles.sort(
    (a, b) =>
      new Date(b.meta.dateISO).getTime() - new Date(a.meta.dateISO).getTime()
  )

  // Un seul article featured (le plus récent marqué comme tel)
  let featuredAssigned = false
  return sorted.map((article) => {
    if (article.meta.featured && !featuredAssigned) {
      featuredAssigned = true
      return article
    }
    return { ...article, meta: { ...article.meta, featured: false } }
  })
}

/**
 * Retourne un article complet par slug.
 */
export function getArticleBySlug(slug: string): Article | null {
  const filePath = path.join(BLOGS_DIR, `${slug}.json`)
  if (!fs.existsSync(filePath)) return null
  const raw = fs.readFileSync(filePath, "utf-8")
  return JSON.parse(raw) as Article
}

/**
 * Retourne les N derniers articles (pour l'ArticleGrid de la homepage).
 */
export function getLatestArticles(count = 3): ArticlePreview[] {
  return getAllArticles().slice(0, count)
}

/**
 * Retourne toutes les catégories uniques.
 */
export function getAllCategories(): string[] {
  const cats = getAllArticles().map((a) => a.meta.category)
  return [...new Set(cats)].sort()
}

/**
 * Pour generateStaticParams de Next.js.
 */
export function getAllSlugs(): { slug: string }[] {
  const files = fs.readdirSync(BLOGS_DIR).filter((f) => f.endsWith(".json"))
  return files.map((f) => ({ slug: f.replace(".json", "") }))
}
