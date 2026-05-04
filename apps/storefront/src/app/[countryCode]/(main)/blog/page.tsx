import { getAllArticles, getAllCategories } from "@lib/blog"
import BlogList from "@modules/blog/components/BlogList"
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Blog — Kōgei",
  description: "Articles & récits sur l'artisanat japonais",
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
