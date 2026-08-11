import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { BLOG_MODULE } from "../../../../modules/blog"
import type BlogModuleService from "../../../../modules/blog/service"

/**
 * GET /store/pages/:path
 * Page autonome complète (avec les blocs), par URL personnalisée.
 */
export const GET = async (req: MedusaRequest, res: MedusaResponse) => {
  const blogService: BlogModuleService = req.scope.resolve(BLOG_MODULE)
  const { path } = req.params as { path: string }

  const page = await blogService.getPageByPath(path)

  if (!page) {
    return res.status(404).json({ message: `Page "${path}" introuvable.` })
  }

  res.json({ page })
}
