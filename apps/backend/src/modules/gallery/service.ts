import { MedusaService } from "@medusajs/framework/utils"
import GalleryImage from "./models/gallery-image"

class GalleryModuleService extends MedusaService({ GalleryImage }) {
  /**
   * Images actives, triées par `rank` croissant — pour le storefront.
   */
  async listActiveImages() {
    const images = await this.listGalleryImages({ active: true })
    return images.sort((a, b) => (a.rank ?? 0) - (b.rank ?? 0))
  }

  /**
   * Toutes les images (actives ou non), triées par `rank` — pour l'admin.
   */
  async listImagesForAdmin() {
    const images = await this.listGalleryImages({})
    return images.sort((a, b) => (a.rank ?? 0) - (b.rank ?? 0))
  }
}

export default GalleryModuleService
