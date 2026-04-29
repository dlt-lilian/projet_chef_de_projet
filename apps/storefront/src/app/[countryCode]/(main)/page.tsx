
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
import ProductGrid from "@modules/home/components/products-grid"
import Banner from "@modules/home/components/banner"
import Gallery from "@modules/home/components/gallery"
import { Slider } from "@modules/home/components/slider"
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
      <div className="my-10 space-y-10">

        {/*<Hero />*/}
        <div className="mx-64 ">
          <ProductGrid regionId={region.id}
                       countryCode={countryCode}/>
        </div>

        <Banner />

        <div className="mx-64">
          <Gallery />
        </div>

        {/*<div className="py-12">*/}
        {/*  <ul className="flex flex-col gap-x-6">*/}
        {/*    <FeaturedProducts collections={collections} region={region} />*/}
        {/*  </ul>*/}
        {/*</div>*/}
      </div>
    </>
  )
}