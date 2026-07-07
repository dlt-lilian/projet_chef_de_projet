import type {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import { GALLERY_MODULE } from "../../../../modules/gallery"
import type GalleryModuleService from "../../../../modules/gallery/service"
import { sanitizeAspect, sanitizeColSpan } from "../route"

/**
 * PUT /admin/gallery/:id
 * Met à jour une image (source, alt, format, rang, visibilité).
 */
export const PUT = async (
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse
) => {
  const svc: GalleryModuleService = req.scope.resolve(GALLERY_MODULE)
  const { id } = req.params as { id: string }
  const body = req.body as Record<string, unknown>

  const [existing] = await svc.listGalleryImages({ id })
  if (!existing) {
    return res.status(404).json({ message: `Image "${id}" introuvable.` })
  }

  const patch: Record<string, unknown> = { id }
  for (const key of ["src", "alt", "aspect", "col_span", "rank", "active"]) {
    if (key in body) patch[key] = body[key]
  }
  if ("aspect" in patch) patch.aspect = sanitizeAspect(patch.aspect)
  if ("col_span" in patch) patch.col_span = sanitizeColSpan(patch.col_span)

  const updated = await svc.updateGalleryImages(patch)
  res.json({ image: Array.isArray(updated) ? updated[0] : updated })
}

/**
 * DELETE /admin/gallery/:id
 */
export const DELETE = async (
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse
) => {
  const svc: GalleryModuleService = req.scope.resolve(GALLERY_MODULE)
  const { id } = req.params as { id: string }

  await svc.deleteGalleryImages(id)
  res.json({ id, deleted: true })
}
