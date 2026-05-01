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
  const third = Math.ceil(images.length / 3)

  const col1 = images.slice(0, third)
  const col2 = images.slice(third, third * 2)
  const col3 = images.slice(third * 2)

  const renderColumn = (imgs: GalleryImage[]) =>
    imgs.map((img, i) => (
      <img
        key={i}
        src={img.src}
        alt={img.alt}
        className={`w-full object-cover rounded-xl ${aspectClass[img.aspect ?? "portrait"]}`}
      />
    ))

  return (
    <div className="grid grid-cols-3 gap-4">
      {/* Colonne gauche */}
      <div className="flex flex-col gap-4">
        {renderColumn(col1)}
      </div>

      {/* Colonne centrale décalée vers le bas */}
      <div className="flex flex-col gap-4 mt-12">
        {renderColumn(col2)}
      </div>

      {/* Colonne droite */}
      <div className="flex flex-col gap-4">
        {renderColumn(col3)}
      </div>
    </div>
  )
}

export default Gallery