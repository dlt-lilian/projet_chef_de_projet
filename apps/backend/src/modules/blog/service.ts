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

    const posts = await this.listBlogPosts(filters, {
      take: options?.limit ?? 100,
      skip: options?.offset ?? 0,
      // Tri géré côté API après récupération (date_iso string)
    })

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
    return this.getPublishedPosts({ limit: count })
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
