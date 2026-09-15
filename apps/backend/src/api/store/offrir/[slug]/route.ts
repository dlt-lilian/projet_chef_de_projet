import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { BLOG_MODULE } from "../../../../modules/blog"
import type BlogModuleService from "../../../../modules/blog/service"

/**
 * GET /store/offrir/:slug
 * Article complet (avec les blocs) de la rubrique « Offrir ».
 */
export const GET = async (
  req: MedusaRequest,
  res: MedusaResponse
) => {
  const blogService: BlogModuleService = req.scope.resolve(BLOG_MODULE)
  const { slug } = req.params as { slug: string }

  const post = await blogService.getBlogPostBySlug(slug)

  // Symétrique de /store/blogs/:slug : un article de blog, ou une page
  // autonome, n'est pas servi sous /offrir.
  if (!post || !post.offrir || post.path) {
    return res.status(404).json({ message: `Article "${slug}" introuvable.` })
  }

  res.json({ blog: post })
}
