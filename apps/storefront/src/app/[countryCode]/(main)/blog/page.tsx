import { getAllArticles, getAllCategories } from "@lib/blog"
import BlogList from "@modules/blog/components/BlogList"
import type { Metadata } from "next"
import { canonicalPath, hreflangAlternates } from "@lib/util/seo"

export async function generateMetadata(props: {
  params: Promise<{ countryCode: string }>
}): Promise<Metadata> {
  const { countryCode } = await props.params
  const canonical = canonicalPath(countryCode, "/blog")
  const description =
    "Essences de bois, matières, usages et entretien : nos articles sur les baguettes, éventails et ombrelles japonaises que nous fabriquons en France."

  return {
    title: "Blog",
    description,
    alternates: { canonical, languages: hreflangAlternates("/blog") },
    openGraph: { title: "Blog | Hinaso", description, url: canonical },
  }
}

export const revalidate = 60

export default async function BlogPage() {
  const [articles, categories] = await Promise.all([
    getAllArticles(),
    getAllCategories(),
  ])

  return (
    <div className="bg-white min-h-screen">
      <div className="content-container py-10 md:py-14">
        <div className="mb-8">
          <p className="text-xs text-gray-500 mb-2">Accueil / Blog</p>
          <h1 className="text-3xl md:text-4xl text-grey-90 font-semibold">
            Le Blog
          </h1>
        </div>

        {articles.length === 0 ? (
          <p className="text-center text-gray-500 py-32 text-sm">
            Aucun article publié pour l'instant.
          </p>
        ) : (
          <BlogList articles={articles} categories={categories} />
        )}
      </div>
    </div>
  )
}
