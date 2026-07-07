import type {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import { GALLERY_MODULE } from "../../../modules/gallery"
import type GalleryModuleService from "../../../modules/gallery/service"

/**
 * GET /admin/gallery
 * Liste toutes les images (actives ou non), triées par rank.
 */
export const GET = async (
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse
) => {
  const svc: GalleryModuleService = req.scope.resolve(GALLERY_MODULE)
  const images = await svc.listImagesForAdmin()
  res.json({ images })
}

// Formats autorisés (aspect) et nombre de colonnes (col_span) partagés avec le PUT.
export const GALLERY_ASPECTS = ["portrait", "square", "landscape"]
export const sanitizeAspect = (v: unknown): string =>
  GALLERY_ASPECTS.includes(v as string) ? (v as string) : "portrait"
export const sanitizeColSpan = (v: unknown): number =>
  [1, 2, 3].includes(Number(v)) ? Number(v) : 1

/**
 * POST /admin/gallery
 * Crée une image. Body : { src, alt, aspect?, col_span?, rank?, active? }
 */
export const POST = async (
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse
) => {
  const svc: GalleryModuleService = req.scope.resolve(GALLERY_MODULE)
  const body = req.body as Record<string, unknown>

  const image = await svc.createGalleryImages({
    src:      (body.src as string) ?? "",
    alt:      (body.alt as string) ?? "",
    aspect:   sanitizeAspect(body.aspect),
    col_span: sanitizeColSpan(body.col_span),
    rank:     typeof body.rank === "number" ? body.rank : 0,
    active:   typeof body.active === "boolean" ? body.active : true,
  })

  res.status(201).json({ image })
}
