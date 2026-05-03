import { useEffect, useState } from "react"
import { useParams, Link } from "react-router-dom"
import { Heading, Text, toast } from "@medusajs/ui"
import BlogForm, { type BlogFormData } from "../../../components/blog/BlogForm"

type BlogPost = BlogFormData & { id: string }

async function fetchPost(id: string): Promise<BlogPost> {
  const res = await fetch(`/admin/blogs/${id}`, { credentials: "include" })
  if (!res.ok) throw new Error("Article introuvable.")
  const { blog } = await res.json()
  return blog
}

async function updatePost(id: string, data: BlogFormData) {
  const res = await fetch(`/admin/blogs/${id}`, {
    method: "PUT",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  })
  if (!res.ok) {
    const err = await res.json()
    throw new Error(err.message ?? "Erreur lors de la mise à jour.")
  }
  return res.json()
}

export default function BlogEditPage() {
  const { id } = useParams<{ id: string }>()
  const [post, setPost] = useState<BlogPost | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!id) return
    fetchPost(id)
      .then(setPost)
      .catch(() => toast.error("Impossible de charger l'article."))
      .finally(() => setLoading(false))
  }, [id])

  if (loading) {
    return (
      <div className="p-8">
        <Text size="small" className="text-ui-fg-muted">Chargement…</Text>
      </div>
    )
  }

  if (!post) {
    return (
      <div className="p-8">
        <Text className="text-ui-fg-error">Article introuvable.</Text>
      </div>
    )
  }

  return (
    <div className="p-8 max-w-4xl">
      <div className="mb-8">
        <div className="flex items-center gap-2 text-ui-fg-muted text-sm mb-2">
          <Link to="/blogs" className="hover:text-ui-fg-interactive transition-colors">
            Blog
          </Link>
          <span>/</span>
          <span className="truncate max-w-xs">{post.title}</span>
        </div>
        <Heading>{post.title}</Heading>
        <Text size="small" className="text-ui-fg-muted mt-1 font-mono">
          /blog/{post.slug}
        </Text>
      </div>

      <BlogForm
        mode="edit"
        initialData={post}
        onSubmit={(data) => updatePost(post.id, data)}
      />
    </div>
  )
}