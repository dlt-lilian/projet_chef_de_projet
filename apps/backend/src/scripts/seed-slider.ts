/**
 * Seed : importe les slides du carrousel d'accueil actuellement codés en dur
 * côté storefront (apps/storefront/src/app/[countryCode]/(main)/page.tsx →
 * FALLBACK_SLIDES) dans la table `slide`.
 *
 * Usage (depuis apps/backend) :
 *   npx medusa exec src/scripts/seed-slider.ts
 *
 * Idempotent : si des slides existent déjà, on ne fait rien.
 */
import { SLIDER_MODULE } from "../modules/slider"
import type SliderModuleService from "../modules/slider/service"
import type { ExecArgs } from "@medusajs/framework/types"

const SLIDES = [
  {
    title: "Nouvelle collection Printemps",
    text: "Découvrez nos pièces exclusives pour la saison.",
    link: "/collections/printemps",
    img: "https://picsum.photos/1920/1080",
  },
  {
    title: "Soldes — jusqu'à -30%",
    text: "Profitez de nos offres sur une sélection de produits.",
    link: "/collections/soldes",
    img: "https://picsum.photos/1920/1080",
  },
]

export default async function seedSlider({ container }: ExecArgs) {
  const svc: SliderModuleService = container.resolve(SLIDER_MODULE)

  const existing = await svc.listSlides({})
  if (existing.length > 0) {
    console.log(
      `⏭  Seed slider ignoré (${existing.length} slide(s) déjà en base).`
    )
    return
  }

  for (let i = 0; i < SLIDES.length; i++) {
    await svc.createSlides({ ...SLIDES[i], rank: i, active: true })
  }
  console.log(`✅ Seed slider — ${SLIDES.length} slides créés.`)
}
