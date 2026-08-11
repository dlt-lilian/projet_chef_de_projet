import type { AuthenticatedMedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { BLOG_MODULE } from "../../../modules/blog"
import { normalizePagePath, validatePagePath } from "../../../modules/blog/page-path"
import type BlogModuleService from "../../../modules/blog/service"

/**
 * GET /admin/blogs
 * Liste tous les articles (publiés ou non).
 */
export const GET = async (
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse
) => {
  const blogService: BlogModuleService = req.scope.resolve(BLOG_MODULE)

  const limit  = req.query.limit  ? parseInt(req.query.limit as string)  : 100
  const offset = req.query.offset ? parseInt(req.query.offset as string) : 0

  const posts = await blogService.listBlogPosts(
    {},
    { take: limit, skip: offset }
  )

  posts.sort(
    (a, b) => new Date(b.date_iso).getTime() - new Date(a.date_iso).getTime()
  )

  res.json({ blogs: posts, count: posts.length, limit, offset })
}

/**
 * POST /admin/blogs
 * Crée un nouvel article.
 *
 * Body : { slug, title, excerpt, cover, category, author,
 *          date, date_iso, read_time, featured, published, blocks }
 */
export const POST = async (
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse
) => {
  const blogService: BlogModuleService = req.scope.resolve(BLOG_MODULE)

  const body = req.body as Record<string, unknown>

  // Vérifie que le slug est unique
  const existing = await blogService.getBlogPostBySlug(body.slug as string)
  if (existing) {
    return res.status(409).json({
      message: `Un article avec le slug "${body.slug}" existe déjà.`,
    })
  }

  // URL personnalisée : format, segments réservés, unicité
  const pagePath = normalizePagePath(body.path)
  if (pagePath) {
    const invalid = validatePagePath(pagePath)
    if (invalid) return res.status(400).json({ message: invalid })

    const [pathConflict] = await blogService.listBlogPosts({ path: pagePath })
    if (pathConflict) {
      return res.status(409).json({
        message: `L'URL "/${pagePath}" est déjà utilisée par "${pathConflict.title}".`,
      })
    }
  }

  const post = await blogService.createBlogPosts({
    slug:      body.slug      as string,
    title:     body.title     as string,
    excerpt:   (body.excerpt  as string) ?? "",
    cover:     (body.cover    as string) ?? "",
    category:  (body.category as string) ?? "",
    author:    (body.author   as string) ?? "",
    date:      (body.date     as string) ?? "",
    date_iso:  (body.date_iso as string) ?? "",
    read_time: (body.read_time as string) ?? "",
    featured:  (body.featured as boolean) ?? false,
    published: (body.published as boolean) ?? false,
    path:      pagePath,
    hide_breadcrumb: (body.hide_breadcrumb as boolean) ?? false,
    hide_meta:       (body.hide_meta       as boolean) ?? false,
    hide_footer:     (body.hide_footer     as boolean) ?? false,
    blocks:    (Array.isArray(body.blocks) ? body.blocks : []) as unknown as Record<string, unknown>,
  })

  res.status(201).json({ blog: post })
}
