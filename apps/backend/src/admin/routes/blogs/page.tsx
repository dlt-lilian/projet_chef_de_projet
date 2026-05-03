import { defineRouteConfig } from "@medusajs/admin-sdk"
import { PencilSquare } from "@medusajs/icons"
import { useEffect, useState } from "react"
import { Link } from "react-router-dom"
import {
  Button,
  Heading,
  Badge,
  Text,
  Table,
  toast,
  usePrompt,
} from "@medusajs/ui"
import { PlusMini, Trash } from "@medusajs/icons"

type BlogPost = {
  id: string
  slug: string
  title: string
  category: string
  author: string
  date: string
  published: boolean
  featured: boolean
}

async function fetchBlogs(): Promise<BlogPost[]> {
  const res = await fetch("/admin/blogs", { credentials: "include" })
  if (!res.ok) throw new Error("Impossible de charger les articles.")
  const { blogs } = await res.json()
  return blogs
}

async function deletePost(id: string): Promise<void> {
  const res = await fetch(`/admin/blogs/${id}`, {
    method: "DELETE",
    credentials: "include",
  })
  if (!res.ok) throw new Error("Suppression échouée.")
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export const config = defineRouteConfig({
  label: "Blog",
  icon: PencilSquare,
})

export default function BlogListPage() {
  const [posts, setPosts] = useState<BlogPost[]>([])
  const [loading, setLoading] = useState(true)
  const prompt = usePrompt()

  const load = async () => {
    try {
      const data = await fetchBlogs()
      setPosts(data)
    } catch {
      toast.error("Impossible de charger les articles.")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  const handleDelete = async (post: BlogPost) => {
    const confirmed = await prompt({
      title: "Supprimer l'article",
      description: `Supprimer "${post.title}" définitivement ? Cette action est irréversible.`,
      confirmText: "Supprimer",
      cancelText: "Annuler",
    })
    if (!confirmed) return

    try {
      await deletePost(post.id)
      toast.success("Article supprimé.")
      load()
    } catch {
      toast.error("Erreur lors de la suppression.")
    }
  }

  return (
    <div className="flex flex-col gap-y-4 p-8">

      {/* ── Header ── */}
      <div className="flex items-center justify-between">
        <div>
          <Heading>Blog</Heading>
          <Text size="small" className="text-ui-fg-muted">
            {posts.length} article{posts.length !== 1 ? "s" : ""}
          </Text>
        </div>
        <Link to="/blogs/new">
          <Button size="small">
            <PlusMini className="mr-1" />
            Nouvel article
          </Button>
        </Link>
      </div>

      {/* ── Table ── */}
      <div className="border border-ui-border-base rounded-lg overflow-hidden">
        <Table>
          <Table.Header>
            <Table.Row>
              <Table.HeaderCell>Titre</Table.HeaderCell>
              <Table.HeaderCell>Catégorie</Table.HeaderCell>
              <Table.HeaderCell>Auteur</Table.HeaderCell>
              <Table.HeaderCell>Date</Table.HeaderCell>
              <Table.HeaderCell>Statut</Table.HeaderCell>
              <Table.HeaderCell />
            </Table.Row>
          </Table.Header>

          <Table.Body>
            {loading && (
              <Table.Row>
                <Table.Cell colSpan={6}>
                  <Text size="small" className="text-ui-fg-muted text-center py-4">
                    Chargement…
                  </Text>
                </Table.Cell>
              </Table.Row>
            )}

            {!loading && posts.length === 0 && (
              <Table.Row>
                <Table.Cell colSpan={6}>
                  <Text size="small" className="text-ui-fg-muted text-center py-8">
                    Aucun article. Crée le premier !
                  </Text>
                </Table.Cell>
              </Table.Row>
            )}

            {posts.map(post => (
              <Table.Row key={post.id}>
                <Table.Cell>
                  <div>
                    <Text weight="plus" size="small">{post.title}</Text>
                    <Text size="xsmall" className="text-ui-fg-muted font-mono">
                      /blog/{post.slug}
                    </Text>
                  </div>
                </Table.Cell>
                <Table.Cell>
                  <Text size="small">{post.category || "—"}</Text>
                </Table.Cell>
                <Table.Cell>
                  <Text size="small">{post.author || "—"}</Text>
                </Table.Cell>
                <Table.Cell>
                  <Text size="small">{post.date || "—"}</Text>
                </Table.Cell>
                <Table.Cell>
                  <div className="flex items-center gap-2">
                    <Badge
                      size="2xsmall"
                      color={post.published ? "green" : "grey"}
                    >
                      {post.published ? "Publié" : "Brouillon"}
                    </Badge>
                    {post.featured && (
                      <Badge size="2xsmall" color="blue">À la une</Badge>
                    )}
                  </div>
                </Table.Cell>
                <Table.Cell>
                  <div className="flex items-center gap-2 justify-end">
                    <Link to={`/blogs/${post.id}`}>
                      <Button variant="secondary" size="small">
                        Modifier
                      </Button>
                    </Link>
                    <Button
                      variant="transparent"
                      size="small"
                      onClick={() => handleDelete(post)}
                      className="text-ui-fg-error hover:text-ui-fg-error"
                    >
                      <Trash />
                    </Button>
                  </div>
                </Table.Cell>
              </Table.Row>
            ))}
          </Table.Body>
        </Table>
      </div>
    </div>
  )
}