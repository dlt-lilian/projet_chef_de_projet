import { notFound } from "next/navigation"
import { getAllSlugs, getArticleBySlug } from "@lib/blog"
import { listRegions } from "@lib/data/regions"
import ArticleTemplate from "@modules/blog/templates/article"
import type { Metadata } from "next"
import JsonLd from "@modules/common/components/json-ld"
import { blogPostingJsonLd, canonicalPath, hreflangAlternates } from "@lib/util/seo"

// Next.js 15 : params est une Promise
type Props = { params: Promise<{ slug: string; countryCode: string }> }

export const revalidate = 60

export async function generateStaticParams() {
  try {
    // La route a DEUX segments dynamiques : [countryCode] et [slug].
    // generateStaticParams doit fournir les deux (cf. products/[handle]),
    // sinon le build de prod échoue faute de countryCode.
    const countryCodes = await listRegions().then((regions) =>
      regions?.map((r) => r.countries?.map((c) => c.iso_2)).flat()
    )

    if (!countryCodes) return []

    const slugs = await getAllSlugs()

    return countryCodes
      .filter(Boolean)
      .flatMap((countryCode) =>
        slugs.map(({ slug }) => ({ countryCode: countryCode as string, slug }))
      )
  } catch (error) {
    console.error(
      `Failed to generate static paths for blog pages: ${
        error instanceof Error ? error.message : "Unknown error"
      }.`
    )
    return []
  }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug, countryCode } = await params
  const post = await getArticleBySlug(slug)
  if (!post) return {}
  const canonical = canonicalPath(countryCode, `/blog/${slug}`)
  const ogTitle = `${post.title} | Hinaso`
  return {
    title: post.title,
    description: post.excerpt,
    alternates: { canonical, languages: hreflangAlternates(`/blog/${slug}`) },
    openGraph: {
      title: ogTitle,
      description: post.excerpt,
      url: canonical,
      type: "article",
      publishedTime: post.date_iso,
      images: post.cover ? [{ url: post.cover }] : [],
    },
    twitter: {
      card: "summary_large_image",
      title: ogTitle,
      description: post.excerpt,
      images: post.cover ? [post.cover] : [],
    },
  }
}

export default async function BlogArticlePage({ params }: Props) {
  const { slug, countryCode } = await params
  const post = await getArticleBySlug(slug)
  if (!post) notFound()

  return (
    <>
      <JsonLd
        data={blogPostingJsonLd({
          title: post.title,
          description: post.excerpt,
          image: post.cover,
          path: canonicalPath(countryCode, `/blog/${slug}`),
          author: post.author,
          datePublished: post.date_iso,
        })}
      />
      <ArticleTemplate post={post} />
    </>
  )
}
