import type {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import { SLIDER_MODULE } from "../../../modules/slider"
import type SliderModuleService from "../../../modules/slider/service"

/**
 * GET /admin/slider
 * Liste tous les slides (actifs ou non), triés par rank.
 */
export const GET = async (
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse
) => {
  const svc: SliderModuleService = req.scope.resolve(SLIDER_MODULE)
  const slides = await svc.listSlidesForAdmin()
  res.json({ slides })
}

/**
 * POST /admin/slider
 * Crée un slide. Body : { title, text, link, img, rank?, active? }
 */
export const POST = async (
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse
) => {
  const svc: SliderModuleService = req.scope.resolve(SLIDER_MODULE)
  const body = req.body as Record<string, unknown>

  const slide = await svc.createSlides({
    title:  (body.title as string) ?? "",
    text:   (body.text as string) ?? "",
    link:   (body.link as string) ?? "",
    img:    (body.img as string) ?? "",
    rank:   typeof body.rank === "number" ? body.rank : 0,
    active: typeof body.active === "boolean" ? body.active : true,
  })

  res.status(201).json({ slide })
}
