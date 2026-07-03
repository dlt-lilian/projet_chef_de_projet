import { model } from "@medusajs/framework/utils"

/**
 * Slide du carrousel d'accueil du storefront.
 *
 * Correspond au type `SlideData` du storefront ({ title, text, link, img }).
 * `rank` ordonne les slides ; `active` masque un slide sans le supprimer.
 */
const Slide = model.define("slide", {
  id:     model.id({ prefix: "slide" }).primaryKey(),
  title:  model.text(),
  text:   model.text(),
  link:   model.text(),
  img:    model.text(),
  rank:   model.number().default(0),
  active: model.boolean().default(true),
})

export default Slide
