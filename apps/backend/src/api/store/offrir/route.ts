import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { BLOG_MODULE } from "../../../modules/blog"
import type BlogModuleService from "../../../modules/blog/service"

/**
 * GET /store/offrir
 *
 * Articles publiés de la rubrique « Offrir » (cochés « Offrir » dans l'admin),
 * du plus récent au plus ancien. Sous-ensemble de /store/blogs, qui les liste
 * aussi : ils restent visibles sur le blog.
 *
 * Query params :
 *   ?limit=10            nombre max d'articles (défaut: 100)
 *   ?offset=0            pagination
 *   ?fields=meta         retourne uniquement les méta (sans les blocs)
 */
export const GET = async (req: MedusaRequest, res: MedusaResponse) => {
  const blogService: BlogModuleService = req.scope.resolve(BLOG_MODULE)

  const limit    = req.query.limit  ? parseInt(req.query.limit as string)  : 100
  const offset   = req.query.offset ? parseInt(req.query.offset as string) : 0
  const metaOnly = req.query.fields === "meta"

  const posts = await blogService.getPublishedPosts({ offrir: true, limit, offset })

  // Mode meta-only : on retire les blocs pour alléger la réponse (listing)
  const data = metaOnly
    ? posts.map(({ blocks: _blocks, ...rest }) => rest)
    : posts

  res.json({
    blogs: data,
    count: data.length,
    limit,
    offset,
  })
}
