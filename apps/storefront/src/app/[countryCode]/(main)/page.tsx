
const slides = [
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

import { Metadata } from "next"

import FeaturedProducts from "@modules/home/components/featured-products"
import Hero from "@modules/home/components/hero"
import { Slider } from "@modules/home/components/slider"  // ← import en haut
import { listCollections } from "@lib/data/collections"
import { getRegion } from "@lib/data/regions"

export const metadata: Metadata = {
  title: "Medusa Next.js Starter Template",
  description:
    "A performant frontend ecommerce starter template with Next.js 15 and Medusa.",
}

export default async function Home(props: {
  params: Promise<{ countryCode: string }>
}) {
  const params = await props.params
  const { countryCode } = params
  const region = await getRegion(countryCode)
  const { collections } = await listCollections({
    fields: "id, handle, title",
  })

  if (!collections || !region) {
    return null
  }

  return (
    <>
      <Slider slides={slides} />

      <Hero />

      <div className="py-12">
        <ul className="flex flex-col gap-x-6">
          <FeaturedProducts collections={collections} region={region} />
        </ul>
      </div>
    </>
  )
}