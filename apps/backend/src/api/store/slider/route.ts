import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { SLIDER_MODULE } from "../../../modules/slider"
import type SliderModuleService from "../../../modules/slider/service"

/**
 * GET /store/slider
 *
 * Renvoie les slides actifs, triés par rank, dans la forme attendue par le
 * storefront (SlideData : { title, text, link, img }).
 */
export const GET = async (req: MedusaRequest, res: MedusaResponse) => {
  const svc: SliderModuleService = req.scope.resolve(SLIDER_MODULE)
  const slides = await svc.listActiveSlides()

  res.json({
    slides: slides.map((s) => ({
      title: s.title,
      text: s.text,
      link: s.link,
      img: s.img,
    })),
  })
}
