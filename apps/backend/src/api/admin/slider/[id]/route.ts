import type {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import { SLIDER_MODULE } from "../../../../modules/slider"
import type SliderModuleService from "../../../../modules/slider/service"

/**
 * PUT /admin/slider/:id
 * Met à jour un slide (titre, texte, lien, image, rang, visibilité).
 */
export const PUT = async (
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse
) => {
  const svc: SliderModuleService = req.scope.resolve(SLIDER_MODULE)
  const { id } = req.params as { id: string }
  const body = req.body as Record<string, unknown>

  const [existing] = await svc.listSlides({ id })
  if (!existing) {
    return res.status(404).json({ message: `Slide "${id}" introuvable.` })
  }

  const patch: Record<string, unknown> = { id }
  for (const key of ["title", "text", "link", "img", "rank", "active"]) {
    if (key in body) patch[key] = body[key]
  }

  const updated = await svc.updateSlides(patch)
  res.json({ slide: Array.isArray(updated) ? updated[0] : updated })
}

/**
 * DELETE /admin/slider/:id
 */
export const DELETE = async (
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse
) => {
  const svc: SliderModuleService = req.scope.resolve(SLIDER_MODULE)
  const { id } = req.params as { id: string }

  await svc.deleteSlides(id)
  res.json({ id, deleted: true })
}
