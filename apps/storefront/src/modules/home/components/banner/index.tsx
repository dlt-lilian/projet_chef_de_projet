import { Icon } from "@modules/common/components/my_ui/icon"

type Feature = {
  icon: string
  title: string
  description: string
}

const features: Feature[] = [
  {
    icon: "package",
    title: "Livraison soignée",
    description: "Expédition rapide et emballage protecteur.",
  },
  {
    // TODO: « leaf » (feuille) ne signe pas la fabrication française — icône à
    // revoir (map-pin / flag) une fois le jeu d'icônes disponible vérifié.
    icon: "leaf",
    title: "Fabriqué en France",
    description: "Conception et fabrication réalisées en France.",
  },
  {
    // Remplace « Fait à la main / artisans passionnés » : invérifiable en l'état,
    // là où le sur-mesure, lui, est démontré par le configurateur de la fiche.
    icon: "hand-heart",
    title: "Pièce sur-mesure",
    description: "Couleur, matière, motif : vous configurez la vôtre en 3D.",
  },
]

const Banner = () => {
  return (
    <section className="bg-grey-20 py-12 md:py-16">
      <div className="content-container grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-6">
        {features.map((f) => (
          <div
            key={f.title}
            className="flex flex-col items-center text-center gap-2"
          >
            <Icon name={f.icon} size={28} />
            <h3 className="text-lg font-semibold mt-2">{f.title}</h3>
            <p className="text-sm text-gray-600 max-w-[260px]">
              {f.description}
            </p>
          </div>
        ))}
      </div>
    </section>
  )
}

export default Banner
