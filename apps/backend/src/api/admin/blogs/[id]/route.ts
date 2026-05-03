import type { AuthenticatedMedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { BLOG_MODULE } from "../../../../modules/blog"
import type BlogModuleService from "../../../../modules/blog/service"

/**
 * GET /admin/blogs/:id
 */
export const GET = async (
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse
) => {
  const blogService: BlogModuleService = req.scope.resolve(BLOG_MODULE)
  const { id } = req.params as { id: string }

  const [post] = await blogService.listBlogPosts({ id })
  if (!post) {
    return res.status(404).json({ message: `Article "${id}" introuvable.` })
  }

  res.json({ blog: post })
}

/**
 * PUT /admin/blogs/:id
 */
export const PUT = async (
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse
) => {
  const blogService: BlogModuleService = req.scope.resolve(BLOG_MODULE)
  const { id } = req.params as { id: string }
  const body = req.body as Record<string, unknown>

  // Vérifie que l'article existe
  const [existing] = await blogService.listBlogPosts({ id })
  if (!existing) {
    return res.status(404).json({ message: `Article "${id}" introuvable.` })
  }

  // Si le slug change, vérifie l'unicité
  if (body.slug && body.slug !== existing.slug) {
    const slugConflict = await blogService.getBlogPostBySlug(body.slug as string)
    if (slugConflict) {
      return res.status(409).json({
        message: `Le slug "${body.slug}" est déjà utilisé.`,
      })
    }
  }

  // MedusaService updateBlogPosts attend : ({ id, ...data })
  // Le champ blocks (JSONB) doit être explicitement inclus
  const updated = await blogService.updateBlogPosts([
    {
      id,
      slug:      body.slug      as string,
      title:     body.title     as string,
      excerpt:   body.excerpt   as string,
      cover:     body.cover     as string,
      category:  body.category  as string,
      author:    body.author    as string,
      date:      body.date      as string,
      date_iso:  body.date_iso  as string,
      read_time: body.read_time as string,
      featured:  body.featured  as boolean,
      published: body.published as boolean,
      blocks:    body.blocks    as unknown[],
    },
  ])

  res.json({ blog: Array.isArray(updated) ? updated[0] : updated })
}

/**
 * DELETE /admin/blogs/:id
 */
export const DELETE = async (
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse
) => {
  const blogService: BlogModuleService = req.scope.resolve(BLOG_MODULE)
  const { id } = req.params as { id: string }

  await blogService.deleteBlogPosts(id)

  res.json({ id, deleted: true })
}