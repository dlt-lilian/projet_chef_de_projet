import { MedusaService } from "@medusajs/framework/utils"
import BlogPost from "./models/blog-post"

class BlogModuleService extends MedusaService({ BlogPost }) {
  /**
   * Récupère un article par slug (uniquement si publié).
   */
  async getBlogPostBySlug(slug: string) {
    const [post] = await this.listBlogPosts({
      slug,
      published: true,
    })
    return post ?? null
  }

  /**
   * Page autonome par URL personnalisée (uniquement si publiée).
   */
  async getPageByPath(path: string) {
    if (!path) return null
    const [page] = await this.listBlogPosts({ path, published: true })
    return page ?? null
  }

  /**
   * Toutes les pages autonomes publiées — sitemap et prérendu du storefront.
   */
  async getPublishedPages() {
    const posts = await this.listBlogPosts({ published: true }, { take: 1000 })
    return posts.filter((p) => Boolean(p.path))
  }

  /**
   * Liste les articles publiés, triés du plus récent au plus ancien.
   * Utilisé par le storefront.
   */
  async getPublishedPosts(options?: {
    category?: string
    limit?: number
    offset?: number
  }) {
    const filters: Record<string, unknown> = { published: true }
    if (options?.category) filters.category = options.category

    const all = await this.listBlogPosts(filters, {
      take: options?.limit ?? 100,
      skip: options?.offset ?? 0,
      // Tri géré côté API après récupération (date_iso string)
    })

    // Les pages autonomes (URL personnalisée) ne sont pas des articles :
    // elles vivent à leur propre URL et n'apparaissent dans aucune liste.
    // Filtre en JS et non en SQL : `path` peut valoir NULL ou "" selon
    // l'ancienneté de la ligne, un `where path is null` en raterait la moitié.
    const posts = all.filter((p) => !p.path)

    // Tri par date_iso décroissant
    posts.sort(
      (a, b) =>
        new Date(b.date_iso).getTime() - new Date(a.date_iso).getTime()
    )

    // S'assure qu'un seul article est featured
    let featuredAssigned = false
    return posts.map((post) => {
      if (post.featured && !featuredAssigned) {
        featuredAssigned = true
        return post
      }
      return { ...post, featured: false }
    })
  }

  /**
   * Retourne les N derniers articles publiés (pour l'ArticleGrid homepage).
   */
  async getLatestPosts(count = 3) {
    // On tronque APRÈS coup : `limit` s'applique avant le retrait des pages
    // autonomes, il rendrait moins de `count` articles s'il en croisait.
    const posts = await this.getPublishedPosts()
    return posts.slice(0, count)
  }

  /**
   * Toutes les catégories uniques.
   */
  async getAllCategories(): Promise<string[]> {
    const posts = await this.getPublishedPosts()
    const cats = posts.map((p) => p.category).filter(Boolean)
    return [...new Set(cats)].sort()
  }
}

export default BlogModuleService
