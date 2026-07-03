import { model } from "@medusajs/framework/utils"

/**
 * Image de la galerie (masonry) de la page d'accueil du storefront.
 *
 * Correspond au type `GalleryImage` du storefront ({ src, alt, aspect }).
 * `aspect` vaut "portrait" ou "square" ; `rank` ordonne, `active` masque.
 */
const GalleryImage = model.define("gallery_image", {
  id:     model.id({ prefix: "galimg" }).primaryKey(),
  src:    model.text(),
  alt:    model.text(),
  aspect: model.text().default("portrait"),
  rank:   model.number().default(0),
  active: model.boolean().default(true),
})

export default GalleryImage
