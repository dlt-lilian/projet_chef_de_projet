export type GalleryImage = {
  src: string
  alt: string
  aspect?: "portrait" | "square" | "landscape"
  /** Nombre de colonnes occupées dans la grille (1 à 3). Défaut : 1. */
  colSpan?: 1 | 2 | 3
}

type GalleryProps = {
  images?: GalleryImage[]
}

const defaultImages: GalleryImage[] = [
  { src: "https://picsum.photos/seed/a1/800/1066", alt: "", aspect: "portrait" },
  { src: "https://picsum.photos/seed/a4/800/800", alt: "", aspect: "square" },
  { src: "https://picsum.photos/seed/a3/800/1066", alt: "", aspect: "portrait" },
  { src: "https://picsum.photos/seed/b1/800/800", alt: "", aspect: "square" },
  { src: "https://picsum.photos/seed/b2/800/1066", alt: "", aspect: "portrait" },
  { src: "https://picsum.photos/seed/b3/800/800", alt: "", aspect: "square" },
]

const aspectClass: Record<NonNullable<GalleryImage["aspect"]>, string> = {
  portrait: "aspect-[3/4]",
  square: "aspect-square",
  landscape: "aspect-[4/3]",
}

// Nombre de colonnes occupées par l'image. Plafonné à 2 colonnes sur mobile
// (grille à 2 colonnes) puis jusqu'à 3 à partir de `md` (grille à 3 colonnes).
const spanClass: Record<NonNullable<GalleryImage["colSpan"]>, string> = {
  1: "",
  2: "col-span-2",
  3: "col-span-2 md:col-span-3",
}

const Gallery = ({ images = defaultImages }: GalleryProps) => {
  // Grille contrôlable depuis l'admin : chaque image choisit son format
  // (portrait 3/4, carré 1/1, paysage 4/3) et le nombre de colonnes qu'elle
  // occupe (1 à 3). Pas de `dense` : l'ordre `rank` défini en admin est
  // préservé (une image large qui ne tient pas passe à la ligne suivante).
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
      {images.map((img, i) => (
        <div
          key={i}
          className={`overflow-hidden rounded-xl ${spanClass[img.colSpan ?? 1]} ${aspectClass[img.aspect ?? "portrait"]}`}
        >
          <img src={img.src} alt={img.alt} className="h-full w-full object-cover" />
        </div>
      ))}
    </div>
  )
}

export default Gallery
