import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { BLOG_MODULE } from "../../../../modules/blog"
import type BlogModuleService from "../../../../modules/blog/service"

/**
 * GET /store/blogs/:slug
 * Retourne un article complet (avec les blocs).
 */
export const GET = async (
  req: MedusaRequest,
  res: MedusaResponse
) => {
  const blogService: BlogModuleService = req.scope.resolve(BLOG_MODULE)
  const { slug } = req.params as { slug: string }

  const post = await blogService.getBlogPostBySlug(slug)

  if (!post) {
    return res.status(404).json({ message: `Article "${slug}" introuvable.` })
  }

  res.json({ blog: post })
}
