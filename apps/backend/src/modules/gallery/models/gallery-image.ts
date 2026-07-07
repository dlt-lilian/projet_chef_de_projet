import { model } from "@medusajs/framework/utils"

/**
 * Image de la galerie (masonry) de la page d'accueil du storefront.
 *
 * Correspond au type `GalleryImage` du storefront ({ src, alt, aspect, colSpan }).
 * `aspect` vaut "portrait" (3/4), "square" (1/1) ou "landscape" (4/3).
 * `col_span` = nombre de colonnes occupées dans la grille (1, 2 ou 3).
 * `rank` ordonne, `active` masque.
 */
const GalleryImage = model.define("gallery_image", {
  id:       model.id({ prefix: "galimg" }).primaryKey(),
  src:      model.text(),
  alt:      model.text(),
  aspect:   model.text().default("portrait"),
  col_span: model.number().default(1),
  rank:     model.number().default(0),
  active:   model.boolean().default(true),
})

export default GalleryImage
