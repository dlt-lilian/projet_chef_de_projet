import { MedusaService } from "@medusajs/framework/utils"
import Slide from "./models/slide"

class SliderModuleService extends MedusaService({ Slide }) {
  /**
   * Slides actifs, triés par `rank` croissant — pour le storefront.
   */
  async listActiveSlides() {
    const slides = await this.listSlides({ active: true })
    return slides.sort((a, b) => (a.rank ?? 0) - (b.rank ?? 0))
  }

  /**
   * Tous les slides (actifs ou non), triés par `rank` — pour l'admin.
   */
  async listSlidesForAdmin() {
    const slides = await this.listSlides({})
    return slides.sort((a, b) => (a.rank ?? 0) - (b.rank ?? 0))
  }
}

export default SliderModuleService
