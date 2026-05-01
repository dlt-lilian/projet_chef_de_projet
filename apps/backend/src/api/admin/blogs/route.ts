import type { AuthenticatedMedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { BLOG_MODULE } from "../../../modules/blog"
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
    blocks:    (body.blocks   as unknown[]) ?? [],
  })

  res.status(201).json({ blog: post })
}
