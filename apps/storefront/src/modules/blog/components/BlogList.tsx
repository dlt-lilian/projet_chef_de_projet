"use client"

import { useState, useMemo } from "react"
import BlogCard from "./BlogCard"
import BlogFilters, { ALL_CATEGORY } from "./BlogFilters"
import type { BlogPostPreview } from "@lib/blog/types"

type BlogListProps = {
  articles: BlogPostPreview[]
  categories: string[]
}

export default function BlogList({ articles, categories }: BlogListProps) {
  const [activeCategory, setActiveCategory] = useState<string>(ALL_CATEGORY)

  const filtered = useMemo(() => {
    if (activeCategory === ALL_CATEGORY) return articles
    return articles.filter((a) => a.category === activeCategory)
  }, [articles, activeCategory])

  return (
    <div className="flex flex-col gap-8">
      <BlogFilters
        categories={categories}
        active={activeCategory}
        onChange={setActiveCategory}
      />

      {filtered.length === 0 ? (
        <p className="text-center text-gray-500 py-20 text-sm">
          Aucun article dans cette catégorie.
        </p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-12">
          {filtered.map((a) => (
            <BlogCard key={a.slug} slug={a.slug} post={a} />
          ))}
        </div>
      )}
    </div>
  )
}
