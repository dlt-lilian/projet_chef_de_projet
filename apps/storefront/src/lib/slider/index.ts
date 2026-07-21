import type { SlideData } from "@modules/home/components/slider"

/**
 * Récupère les slides du carrousel d'accueil depuis le backend Medusa
 * (table `slide`, éditable en admin) au lieu d'un tableau codé en dur.
 *
 * `.replace(/\/+$/, "")` retire un éventuel slash final de l'URL backend
 * (sinon `…app//store/slider` → 404, cf. bug blog).
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
 * FALLBACK statique : slides par défaut affichés tant qu'aucun slide n'est
 * enregistré en base (ou si le backend est injoignable). Garantit que l'accueil
 * n'est jamais vide. Ce sont des images de démonstration (picsum) à remplacer
 * depuis l'admin (upload vers R2).
 */
export const FALLBACK_SLIDES: SlideData[] = [
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

export async function getSlides(): Promise<SlideData[]> {
  try {
    const res = await fetch(`${BACKEND_URL}/store/slider`, {
      headers: headers(),
      next: { revalidate: 60 },
    })
    if (!res.ok) return FALLBACK_SLIDES
    const { slides } = await res.json()
    return Array.isArray(slides) && slides.length > 0
      ? (slides as SlideData[])
      : FALLBACK_SLIDES
  } catch (err) {
    console.error(`[slider] getSlides a échoué (${BACKEND_URL}) :`, err)
    return FALLBACK_SLIDES
  }
}
