import { Metadata } from "next"

import ProductGrid from "@modules/home/components/products-grid"
import Banner from "@modules/home/components/banner"
import Gallery from "@modules/home/components/gallery"
import ArticleGrid from "@modules/blog/components/ArticleGrid"

import { Slider } from "@modules/home/components/slider"
import { listCollections } from "@lib/data/collections"
import { getRegion } from "@lib/data/regions"

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

export const metadata: Metadata = {
  title: "Kōgei — Artisanat japonais",
  description:
    "Pièces d'artisanat japonais : baguettes, éventails, parapluies. Façonnés à la main.",
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

      <div className="content-container my-12 md:my-16">
        <ProductGrid regionId={region.id} countryCode={countryCode} />
      </div>

      <Banner />

      <div className="content-container my-12 md:my-16">
        <Gallery />
      </div>

      <ArticleGrid count={3} heading="Du côté du blog" />
    </>
  )
}
