import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { BLOG_MODULE } from "../../../../modules/blog"
import type BlogModuleService from "../../../../modules/blog/service"

/**
 * GET /store/blogs/categories
 * Retourne la liste des catégories uniques.
 */
export const GET = async (req: MedusaRequest, res: MedusaResponse) => {
  const blogService: BlogModuleService = req.scope.resolve(BLOG_MODULE)
  const categories = await blogService.getAllCategories()
  res.json({ categories })
}
