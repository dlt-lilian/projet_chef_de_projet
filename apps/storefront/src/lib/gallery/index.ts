import type { GalleryImage } from "@modules/home/components/gallery"

/**
 * Récupère les images de la galerie d'accueil depuis le backend Medusa
 * (table `gallery_image`, éditable en admin) au lieu d'un tableau codé en dur.
 *
 * `.replace(/\/+$/, "")` retire un éventuel slash final de l'URL backend
 * (sinon `…app//store/gallery` → 404, cf. bug blog).
 */
const BACKEND_URL = (
  process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL ?? "http://localhost:9000"
).replace(/\/+$/, "")

function headers() {
  return {
    "Content-Type": "application/json",
    "x-publishable-api-key":
      process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY ?? "",
  }
}

/**
 * FALLBACK statique : galerie par défaut affichée tant qu'aucune image n'est
 * enregistrée en base (ou si le backend est injoignable). Ce sont des images de
 * démonstration (picsum) à remplacer depuis l'admin (upload vers R2).
 */
export const FALLBACK_IMAGES: GalleryImage[] = [
  { src: "https://picsum.photos/seed/a1/800/1066", alt: "", aspect: "portrait" },
  { src: "https://picsum.photos/seed/a4/800/800",  alt: "", aspect: "square" },
  { src: "https://picsum.photos/seed/a3/800/1066", alt: "", aspect: "portrait" },
  { src: "https://picsum.photos/seed/b1/800/800",  alt: "", aspect: "square" },
  { src: "https://picsum.photos/seed/b2/800/1066", alt: "", aspect: "portrait" },
  { src: "https://picsum.photos/seed/b3/800/800",  alt: "", aspect: "square" },
]

export async function getGalleryImages(): Promise<GalleryImage[]> {
  try {
    const res = await fetch(`${BACKEND_URL}/store/gallery`, {
      headers: headers(),
      next: { revalidate: 60 },
    })
    if (!res.ok) return FALLBACK_IMAGES
    const { images } = await res.json()
    return Array.isArray(images) && images.length > 0
      ? (images as GalleryImage[])
      : FALLBACK_IMAGES
  } catch (err) {
    console.error(`[gallery] getGalleryImages a échoué (${BACKEND_URL}) :`, err)
    return FALLBACK_IMAGES
  }
}
