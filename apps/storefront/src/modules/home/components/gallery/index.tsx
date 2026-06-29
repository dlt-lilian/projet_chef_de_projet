type GalleryImage = {
  src: string
  alt: string
  aspect?: "portrait" | "square"
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
}

const Gallery = ({ images = defaultImages }: GalleryProps) => {
  // Colonnes CSS : 2 sur mobile, 3 à partir de `md`. Le rendu masonry s'adapte
  // automatiquement aux hauteurs (portrait/carré) sans casser sur petit écran.
  return (
    <div className="columns-2 md:columns-3 gap-4">
      {images.map((img, i) => (
        <img
          key={i}
          src={img.src}
          alt={img.alt}
          className={`w-full object-cover rounded-xl mb-4 break-inside-avoid ${aspectClass[img.aspect ?? "portrait"]}`}
        />
      ))}
    </div>
  )
}

export default Gallery