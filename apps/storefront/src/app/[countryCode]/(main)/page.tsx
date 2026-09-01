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
import {
  SITE_DEFAULT_DESCRIPTION,
  SITE_DEFAULT_TITLE,
  canonicalPath,
  hreflangAlternates,
} from "@lib/util/seo"

export async function generateMetadata(props: {
  params: Promise<{ countryCode: string }>
}): Promise<Metadata> {
  const { countryCode } = await props.params
  const canonical = canonicalPath(countryCode)

  return {
    // `absolute` : l'accueil porte déjà la marque → on n'ajoute pas « | Hinaso ».
    title: { absolute: SITE_DEFAULT_TITLE },
    description: SITE_DEFAULT_DESCRIPTION,
    alternates: { canonical, languages: hreflangAlternates() },
    openGraph: {
      title: SITE_DEFAULT_TITLE,
      description: SITE_DEFAULT_DESCRIPTION,
      url: canonical,
    },
  }
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
      {/* H1 unique de l'accueil : le hero est un carrousel (plusieurs <h2>),
          on fournit donc un H1 sémantique accessible sans perturber le visuel. */}
      <h1 className="sr-only">
        Baguettes, éventails et ombrelles japonaises à configurer en 3D, conçus
        et fabriqués en France
      </h1>

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
