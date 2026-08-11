import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { BLOG_MODULE } from "../../../modules/blog"
import type BlogModuleService from "../../../modules/blog/service"

/**
 * GET /store/pages
 *
 * Liste les pages autonomes publiées (articles avec une URL personnalisée),
 * sans les blocs. Sert au sitemap et au prérendu des routes du storefront.
 */
export const GET = async (req: MedusaRequest, res: MedusaResponse) => {
  const blogService: BlogModuleService = req.scope.resolve(BLOG_MODULE)

  const pages = await blogService.getPublishedPages()
  const data = pages.map(({ blocks: _blocks, ...rest }) => rest)

  res.json({ pages: data, count: data.length })
}
