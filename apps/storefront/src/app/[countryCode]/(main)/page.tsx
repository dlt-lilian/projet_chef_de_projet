import { Metadata } from "next"

import ProductGrid from "@modules/home/components/products-grid"
import Banner from "@modules/home/components/banner"
import Gallery from "@modules/home/components/gallery"
import ArticleGrid from "@modules/blog/components/ArticleGrid"

import { Slider } from "@modules/home/components/slider"
import { getSlides } from "@lib/slider"
import { getGalleryImages } from "@lib/gallery"
import { listCollections } from "@lib/data/collections"
import { getRegion } from "@lib/data/regions"

export const metadata: Metadata = {
  title: "Hinano — Artisanat japonais",
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
  const slides = await getSlides()
  const galleryImages = await getGalleryImages()

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
        <Gallery images={galleryImages} />
      </div>

      <ArticleGrid count={3} heading="Du côté du blog" />
    </>
  )
}
