import Image from "next/image"
import { isOptimizable } from "@lib/util/images"

export type GalleryImage = {
  src: string
  alt: string
  aspect?: "portrait" | "square" | "landscape" | "fill"
  /**
   * Nombre de colonnes occupées (1 à 3). Ignoré pour le format « fill », qui
   * absorbe automatiquement la largeur des colonnes restantes de sa ligne.
   */
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

// Ratio fixe par format. « fill » n'a pas de ratio : il s'étire (cf. flexClass).
const aspectClass: Record<"portrait" | "square" | "landscape", string> = {
  portrait: "aspect-[3/4]",
  square: "aspect-square",
  landscape: "aspect-[4/3]",
}

// Largeur flex par image. Le gap de la grille vaut 1rem (gap-4), pris en compte
// dans les `basis`. Non-« fill » : largeur fixe selon colSpan (repli pleine
// largeur en mobile pour 2-3 colonnes). « fill » : `grow` → l'image absorbe la
// largeur des colonnes libres restantes de sa ligne (base = 1 colonne).
function flexClass(img: GalleryImage): string {
  if (img.aspect === "fill") {
    return "grow self-stretch basis-[calc((100%_-_1rem)/2)] md:basis-[calc((100%_-_2rem)/3)]"
  }
  switch (img.colSpan ?? 1) {
    case 3:
      return "grow-0 shrink-0 basis-full"
    case 2:
      return "grow-0 shrink-0 basis-full md:basis-[calc((200%_-_1rem)/3)]"
    default:
      return "grow-0 shrink-0 basis-[calc((100%_-_1rem)/2)] md:basis-[calc((100%_-_2rem)/3)]"
  }
}

// Largeur réellement occupée, en miroir de `flexClass` — c'est ce que le
// navigateur utilise pour choisir la variante à télécharger dans le srcset.
//
// Sans cet attribut, next/image suppose `100vw` et sert la plus grande variante
// (jusqu'à 3840 px) pour une vignette qui en fait 450 : c'est ce qui coûtait
// 8,4 Mo sur l'accueil. Les valeurs fixes du dernier palier viennent du
// conteneur : `content-container` = max-w 1440 px moins 2 × 24 px de padding,
// soit 1392 px utiles, moins les gouttières `gap-4` (16 px).
function sizesFor(img: GalleryImage): string {
  // « fill » ignore colSpan (cf. flexClass) : il part d'une colonne et s'étire.
  switch (img.aspect === "fill" ? 1 : (img.colSpan ?? 1)) {
    case 3: // pleine largeur sur toutes les tailles
      return "(max-width: 1440px) 100vw, 1392px"
    case 2: // pleine largeur en mobile, 2 colonnes sur 3 au-delà
      return "(max-width: 768px) 100vw, (max-width: 1440px) 66vw, 920px"
    default: // 2 colonnes en mobile, 3 au-delà
      return "(max-width: 768px) 50vw, (max-width: 1440px) 33vw, 453px"
  }
}

// Forme/hauteur : ratio fixe pour les 3 formats, ou min-h pour « fill » (qui se
// cale ensuite sur la hauteur de sa ligne via items-stretch).
function shapeClass(img: GalleryImage): string {
  // « fill » : un simple garde-fou anti-effondrement (utile seulement si l'image
  // est seule sur sa ligne). Volontairement bas — sous la hauteur d'une colonne —
  // pour que ce soient toujours les voisines qui imposent la hauteur de la ligne.
  if (img.aspect === "fill") return "min-h-[6rem] md:min-h-[12rem]"
  return aspectClass[img.aspect ?? "portrait"]
}

const Gallery = ({ images = defaultImages }: GalleryProps) => {
  // Rangées en flex-wrap : chaque image a une largeur fixe (colonnes), sauf le
  // format « fill » qui grandit pour absorber la largeur restante de sa ligne.
  // En hauteur, les images d'une même ligne s'alignent (items-stretch) : une
  // image « fill » se cale sur ses voisines, l'image étant recadrée (object-cover).
  return (
    <div className="flex flex-wrap items-start gap-4">
      {images.map((img, i) => (
        <div
          key={i}
          className={`relative overflow-hidden rounded-xl ${flexClass(img)} ${shapeClass(img)}`}
        >
          {/* `next/image` et non `<img>` : la galerie est alimentée depuis
              l'admin, où l'on dépose des photos en pleine résolution (jusqu'à
              6240 × 4160). Sans redimensionnement ni `sizes`, ces octets
              partaient tels quels — et, faute de `loading="lazy"`, ils entraient
              en concurrence avec l'image du slider pour le LCP.
              `unoptimized` reste le filet de sécurité pour un hôte inconnu
              (cf. isOptimizable). Pas de `priority` : la galerie est sous la
              ligne de flottaison, le chargement différé par défaut est voulu. */}
          <Image
            src={img.src}
            alt={img.alt}
            fill
            sizes={sizesFor(img)}
            unoptimized={!isOptimizable(img.src)}
            className="object-cover"
          />
        </div>
      ))}
    </div>
  )
}

export default Gallery
