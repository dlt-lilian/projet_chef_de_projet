import { Heading, Text } from "@medusajs/ui"
import { Link } from "react-router-dom"
import BlogForm, { type BlogFormData } from "../../../components/blog/BlogForm.tsx";

async function createPost(data: BlogFormData) {
  const res = await fetch("/admin/blogs", {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  })
  if (!res.ok) {
    const err = await res.json()
    throw new Error(err.message ?? "Erreur lors de la création.")
  }
  return res.json()
}

export default function BlogNewPage() {
  return (
    <div className="p-8 max-w-4xl">
      <div className="mb-8">
        <div className="flex items-center gap-2 text-ui-fg-muted text-sm mb-2">
          <Link to="/blog" className="hover:text-ui-fg-interactive transition-colors">
            Blog
          </Link>
          <span>/</span>
          <span>Nouvel article</span>
        </div>
        <Heading>Nouvel article</Heading>
        <Text size="small" className="text-ui-fg-muted mt-1">
          Compose ton article bloc par bloc.
        </Text>
      </div>

      <BlogForm mode="create" onSubmit={createPost} />
    </div>
  )
}
