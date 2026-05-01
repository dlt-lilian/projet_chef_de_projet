import { useState } from "react"
import { useNavigate } from "react-router-dom"
import {
  Button,
  Input,
  Textarea,
  Label,
  Switch,
  Heading,
  Text,
  toast,
  Divider,
} from "@medusajs/ui"
import BlockBuilder from "./BlockBuilder"

type Block = Record<string, unknown>

export type BlogFormData = {
  slug:       string
  title:      string
  excerpt:    string
  cover:      string
  category:   string
  author:     string
  date:       string
  date_iso:   string
  read_time:  string
  featured:   boolean
  published:  boolean
  blocks:     Block[]
}

type BlogFormProps = {
  initialData?: Partial<BlogFormData>
  onSubmit: (data: BlogFormData) => Promise<void>
  mode: "create" | "edit"
}

const EMPTY: BlogFormData = {
  slug:      "",
  title:     "",
  excerpt:   "",
  cover:     "",
  category:  "",
  author:    "",
  date:      "",
  date_iso:  "",
  read_time: "",
  featured:  false,
  published: false,
  blocks:    [],
}

export default function BlogForm({ initialData, onSubmit, mode }: BlogFormProps) {
  const navigate = useNavigate()
  const [data, setData]     = useState<BlogFormData>({ ...EMPTY, ...initialData })
  const [saving, setSaving] = useState(false)

  const set = (field: keyof BlogFormData) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => setData(prev => ({ ...prev, [field]: e.target.value }))

  // Auto-génère le slug depuis le titre
  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const title = e.target.value
    setData(prev => ({
      ...prev,
      title,
      // Génère le slug uniquement si non modifié manuellement (ou en mode create)
      ...(mode === "create"
        ? {
            slug: title
              .toLowerCase()
              .normalize("NFD")
              .replace(/[\u0300-\u036f]/g, "")
              .replace(/[^a-z0-9\s-]/g, "")
              .trim()
              .replace(/\s+/g, "-"),
          }
        : {}),
    }))
  }

  // Auto-remplit date_iso depuis date si elle ressemble à YYYY-MM-DD
  const handleDateIsoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value
    setData(prev => ({ ...prev, date_iso: val }))
    // Auto-génère le label "date" si vide
    if (val && !data.date) {
      try {
        const label = new Date(val).toLocaleDateString("fr-FR", {
          day: "numeric", month: "long", year: "numeric",
        })
        setData(prev => ({ ...prev, date_iso: val, date: label }))
      } catch {}
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!data.title || !data.slug) {
      toast.error("Le titre et le slug sont obligatoires.")
      return
    }
    setSaving(true)
    try {
      await onSubmit(data)
      toast.success(mode === "create" ? "Article créé !" : "Article mis à jour !")
      if (mode === "create") navigate("/blog")
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Erreur inconnue"
      toast.error(msg)
    } finally {
      setSaving(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-8">

      {/* ── Méta ────────────────────────────────────────────────────────── */}
      <div>
        <Heading level="h2" className="mb-5">Informations générales</Heading>

        <div className="grid grid-cols-2 gap-4">

          <div className="col-span-2">
            <Label>Titre *</Label>
            <Input value={data.title} onChange={handleTitleChange} placeholder="Mon super article" required />
          </div>

          <div>
            <Label>Slug *</Label>
            <Input
              value={data.slug}
              onChange={set("slug")}
              placeholder="mon-super-article"
              required
              className="font-mono text-sm"
            />
            <Text size="xsmall" className="text-ui-fg-muted mt-1">
              URL : /blog/<strong>{data.slug || "..."}</strong>
            </Text>
          </div>

          <div>
            <Label>Catégorie</Label>
            <Input value={data.category} onChange={set("category")} placeholder="Design, Voyage, Culture…" />
          </div>

          <div className="col-span-2">
            <Label>Résumé (excerpt)</Label>
            <Textarea
              value={data.excerpt}
              onChange={set("excerpt")}
              rows={2}
              placeholder="Courte description affichée sur les cards (2-3 phrases max.)"
            />
          </div>

          <div className="col-span-2">
            <Label>Image de couverture</Label>
            <Input value={data.cover} onChange={set("cover")} placeholder="/images/cover.jpg ou https://..." />
          </div>

          <div>
            <Label>Auteur</Label>
            <Input value={data.author} onChange={set("author")} placeholder="Prénom Nom" />
          </div>

          <div>
            <Label>Temps de lecture</Label>
            <Input value={data.read_time} onChange={set("read_time")} placeholder="5 min" />
          </div>

          <div>
            <Label>Date ISO (YYYY-MM-DD)</Label>
            <Input
              type="date"
              value={data.date_iso}
              onChange={handleDateIsoChange}
            />
          </div>

          <div>
            <Label>Label affiché</Label>
            <Input
              value={data.date}
              onChange={set("date")}
              placeholder="30 avril 2026"
            />
            <Text size="xsmall" className="text-ui-fg-muted mt-1">
              Auto-rempli depuis la date ISO si vide.
            </Text>
          </div>

        </div>
      </div>

      <Divider />

      {/* ── Options de publication ───────────────────────────────────────── */}
      <div>
        <Heading level="h2" className="mb-5">Publication</Heading>
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <div>
              <Text weight="plus">Publié</Text>
              <Text size="small" className="text-ui-fg-muted">
                L'article est visible sur le storefront.
              </Text>
            </div>
            <Switch
              checked={data.published}
              onCheckedChange={v => setData(prev => ({ ...prev, published: v }))}
            />
          </div>
          <div className="flex items-center justify-between">
            <div>
              <Text weight="plus">Mis en avant</Text>
              <Text size="small" className="text-ui-fg-muted">
                Affiché en hero sur la page blog (un seul à la fois).
              </Text>
            </div>
            <Switch
              checked={data.featured}
              onCheckedChange={v => setData(prev => ({ ...prev, featured: v }))}
            />
          </div>
        </div>
      </div>

      <Divider />

      {/* ── Block builder ────────────────────────────────────────────────── */}
      <div>
        <Heading level="h2" className="mb-2">Contenu</Heading>
        <Text size="small" className="text-ui-fg-muted mb-5">
          Compose l'article en ajoutant et réorganisant des blocs.
        </Text>
        <BlockBuilder
          value={data.blocks as never}
          onChange={blocks => setData(prev => ({ ...prev, blocks }))}
        />
      </div>

      <Divider />

      {/* ── Actions ─────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-end gap-3 pb-8">
        <Button
          type="button"
          variant="secondary"
          onClick={() => navigate("/blog")}
        >
          Annuler
        </Button>
        <Button type="submit" isLoading={saving}>
          {mode === "create" ? "Créer l'article" : "Enregistrer"}
        </Button>
      </div>

    </form>
  )
}
