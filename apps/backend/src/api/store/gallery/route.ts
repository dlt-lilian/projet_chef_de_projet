import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { GALLERY_MODULE } from "../../../modules/gallery"
import type GalleryModuleService from "../../../modules/gallery/service"

/**
 * GET /store/gallery
 *
 * Renvoie les images actives, triées par rank, dans la forme attendue par le
 * storefront (GalleryImage : { src, alt, aspect }).
 */
export const GET = async (req: MedusaRequest, res: MedusaResponse) => {
  const svc: GalleryModuleService = req.scope.resolve(GALLERY_MODULE)
  const images = await svc.listActiveImages()

  res.json({
    images: images.map((i) => ({
      src: i.src,
      alt: i.alt,
      aspect: i.aspect,
    })),
  })
}
