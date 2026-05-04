import { Icon } from "@modules/common/components/my_ui"

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
    icon: "leaf",
    title: "Matériaux nobles",
    description: "Bois, laque et tissus sélectionnés au Japon.",
  },
  {
    icon: "hand-heart",
    title: "Fait à la main",
    description: "Pièces façonnées par des artisans passionnés.",
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
            <h4 className="text-lg font-semibold mt-2">{f.title}</h4>
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
