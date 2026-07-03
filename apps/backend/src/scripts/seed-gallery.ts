/**
 * Seed : importe les images de la galerie d'accueil actuellement codées en dur
 * côté storefront (apps/storefront/src/lib/gallery → FALLBACK_IMAGES) dans la
 * table `gallery_image`.
 *
 * Usage (depuis apps/backend) :
 *   npx medusa exec src/scripts/seed-gallery.ts
 *
 * Idempotent : si des images existent déjà, on ne fait rien.
 */
import { GALLERY_MODULE } from "../modules/gallery"
import type GalleryModuleService from "../modules/gallery/service"
import type { ExecArgs } from "@medusajs/framework/types"

const IMAGES = [
  { src: "https://picsum.photos/seed/a1/800/1066", alt: "", aspect: "portrait" },
  { src: "https://picsum.photos/seed/a4/800/800",  alt: "", aspect: "square" },
  { src: "https://picsum.photos/seed/a3/800/1066", alt: "", aspect: "portrait" },
  { src: "https://picsum.photos/seed/b1/800/800",  alt: "", aspect: "square" },
  { src: "https://picsum.photos/seed/b2/800/1066", alt: "", aspect: "portrait" },
  { src: "https://picsum.photos/seed/b3/800/800",  alt: "", aspect: "square" },
]

export default async function seedGallery({ container }: ExecArgs) {
  const svc: GalleryModuleService = container.resolve(GALLERY_MODULE)

  const existing = await svc.listGalleryImages({})
  if (existing.length > 0) {
    console.log(
      `⏭  Seed galerie ignoré (${existing.length} image(s) déjà en base).`
    )
    return
  }

  for (let i = 0; i < IMAGES.length; i++) {
    await svc.createGalleryImages({ ...IMAGES[i], rank: i, active: true })
  }
  console.log(`✅ Seed galerie — ${IMAGES.length} images créées.`)
}
