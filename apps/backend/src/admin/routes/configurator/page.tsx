import { defineRouteConfig } from "@medusajs/admin-sdk"
import { Swatch } from "@medusajs/icons"
import { useEffect, useState } from "react"
import {
  Button,
  Heading,
  Text,
  Input,
  Label,
  Badge,
  Container,
  toast,
} from "@medusajs/ui"

// ─── Types ──────────────────────────────────────────────────────────────────
type Choice = {
  id: string
  option_id?: string
  choice_key: string
  label: string
  color_hex?: string | null
  texture_path?: string | null
  darken?: number | null
  rank: number
  is_default: boolean
}
type Option = {
  id: string
  option_key: string
  label: string
  type: "color" | "texture" | "motif" | "engraving"
  target_mesh?: string | string[] | null
  rank: number
  choices: Choice[]
}
type Product = {
  id: string
  handle: string
  glb_path: string
  options: Option[]
}

// ─── API helpers ──────────────────────────────────────────────────────────────
const JSON_HEADERS = { "Content-Type": "application/json" }

async function fetchProducts(): Promise<Product[]> {
  const res = await fetch("/admin/configurator", { credentials: "include" })
  if (!res.ok) throw new Error("Chargement impossible.")
  const { products } = await res.json()
  return products
}

function slugify(s: string): string {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
}

// ─── Édition d'un choix existant ──────────────────────────────────────────────
function ChoiceRow({
  option,
  choice,
  onChanged,
}: {
  option: Option
  choice: Choice
  onChanged: () => void
}) {
  const isColor = option.type === "color"
  const isTexture = option.type === "texture"
  const [label, setLabel] = useState(choice.label)
  const [color, setColor] = useState(choice.color_hex ?? "#cccccc")
  const [texture, setTexture] = useState(choice.texture_path ?? "")
  const [darken, setDarken] = useState(String(choice.darken ?? 0))
  const [rank, setRank] = useState(String(choice.rank ?? 0))
  const [busy, setBusy] = useState(false)

  const save = async () => {
    setBusy(true)
    try {
      const body: Record<string, unknown> = { label, rank: Number(rank) }
      if (isColor) body.color_hex = color
      else body.texture_path = texture || null
      if (isTexture) body.darken = Number(darken)
      const res = await fetch(`/admin/configurator/choices/${choice.id}`, {
        method: "PUT",
        credentials: "include",
        headers: JSON_HEADERS,
        body: JSON.stringify(body),
      })
      if (!res.ok) throw new Error()
      toast.success(`« ${label} » enregistré`)
      onChanged()
    } catch {
      toast.error("Échec de l'enregistrement")
    } finally {
      setBusy(false)
    }
  }

  const remove = async () => {
    setBusy(true)
    try {
      const res = await fetch(`/admin/configurator/choices/${choice.id}`, {
        method: "DELETE",
        credentials: "include",
      })
      if (!res.ok) throw new Error()
      toast.success("Choix supprimé")
      onChanged()
    } catch {
      toast.error("Échec de la suppression")
    } finally {
      setBusy(false)
    }
  }

  const makeDefault = async () => {
    setBusy(true)
    try {
      const res = await fetch(`/admin/configurator/choices/${choice.id}`, {
        method: "PUT",
        credentials: "include",
        headers: JSON_HEADERS,
        body: JSON.stringify({ is_default: true }),
      })
      if (!res.ok) throw new Error()
      toast.success(`« ${label} » est le défaut`)
      onChanged()
    } catch {
      toast.error("Échec")
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="flex items-end gap-3 flex-wrap border-b border-ui-border-base py-3">
      <div className="w-40">
        <Label size="xsmall" className="text-ui-fg-muted">Label</Label>
        <Input value={label} onChange={(e) => setLabel(e.target.value)} />
      </div>

      {isColor ? (
        <div>
          <Label size="xsmall" className="text-ui-fg-muted">Couleur</Label>
          <div className="flex items-center gap-2">
            <input
              type="color"
              value={color}
              onChange={(e) => setColor(e.target.value)}
              className="h-8 w-10 rounded border border-ui-border-base bg-transparent"
            />
            <Input
              value={color}
              onChange={(e) => setColor(e.target.value)}
              className="w-28 font-mono text-sm"
            />
          </div>
        </div>
      ) : (
        <div className="w-72">
          <Label size="xsmall" className="text-ui-fg-muted">
            Image {option.type === "motif" ? "(motif)" : "(texture)"} — URL
          </Label>
          <Input
            value={texture}
            onChange={(e) => setTexture(e.target.value)}
            placeholder="https://… ou /3d/…"
            className="font-mono text-xs"
          />
        </div>
      )}

      {isTexture && (
        <div className="w-24">
          <Label size="xsmall" className="text-ui-fg-muted">Assombrir</Label>
          <Input
            type="number"
            step="0.01"
            min="0"
            max="1"
            value={darken}
            onChange={(e) => setDarken(e.target.value)}
          />
        </div>
      )}

      <div className="w-16">
        <Label size="xsmall" className="text-ui-fg-muted">Rang</Label>
        <Input
          type="number"
          value={rank}
          onChange={(e) => setRank(e.target.value)}
        />
      </div>

      <div className="flex items-center gap-2 pb-0.5">
        {choice.is_default ? (
          <Badge size="2xsmall" color="green">Défaut</Badge>
        ) : (
          <Button
            size="small"
            variant="secondary"
            onClick={makeDefault}
            disabled={busy}
          >
            Définir défaut
          </Button>
        )}
        <Button size="small" onClick={save} isLoading={busy}>
          Enregistrer
        </Button>
        <Button
          size="small"
          variant="transparent"
          onClick={remove}
          disabled={busy}
          className="text-ui-fg-error"
        >
          Suppr.
        </Button>
      </div>
    </div>
  )
}

// ─── Ajout d'un choix ─────────────────────────────────────────────────────────
function AddChoice({
  option,
  onAdded,
}: {
  option: Option
  onAdded: () => void
}) {
  const isColor = option.type === "color"
  const isTexture = option.type === "texture"
  const [label, setLabel] = useState("")
  const [color, setColor] = useState("#C4A882")
  const [texture, setTexture] = useState("")
  const [darken, setDarken] = useState("0")
  const [busy, setBusy] = useState(false)

  const add = async () => {
    if (!label.trim()) {
      toast.error("Le label est obligatoire.")
      return
    }
    setBusy(true)
    try {
      const body: Record<string, unknown> = {
        option_id: option.id,
        choice_key: slugify(label) || `choix-${Date.now()}`,
        label,
        rank: option.choices.length,
      }
      if (isColor) body.color_hex = color
      else body.texture_path = texture || null
      if (isTexture) body.darken = Number(darken)
      const res = await fetch("/admin/configurator/choices", {
        method: "POST",
        credentials: "include",
        headers: JSON_HEADERS,
        body: JSON.stringify(body),
      })
      if (!res.ok) throw new Error()
      toast.success(`« ${label} » ajouté`)
      setLabel("")
      setTexture("")
      onAdded()
    } catch {
      toast.error("Échec de l'ajout")
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="flex items-end gap-3 flex-wrap pt-3">
      <div className="w-40">
        <Label size="xsmall" className="text-ui-fg-muted">Nouveau label</Label>
        <Input
          value={label}
          onChange={(e) => setLabel(e.target.value)}
          placeholder={isColor ? "Ex. Rouge cerise" : "Ex. Fleuri"}
        />
      </div>
      {isColor ? (
        <input
          type="color"
          value={color}
          onChange={(e) => setColor(e.target.value)}
          className="h-8 w-10 rounded border border-ui-border-base bg-transparent"
        />
      ) : (
        <div className="w-72">
          <Input
            value={texture}
            onChange={(e) => setTexture(e.target.value)}
            placeholder="URL de l'image"
            className="font-mono text-xs"
          />
        </div>
      )}
      {isTexture && (
        <div className="w-24">
          <Input
            type="number"
            step="0.01"
            min="0"
            max="1"
            value={darken}
            onChange={(e) => setDarken(e.target.value)}
            placeholder="assombrir"
          />
        </div>
      )}
      <Button size="small" variant="secondary" onClick={add} isLoading={busy}>
        + Ajouter
      </Button>
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function ConfiguratorPage() {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)

  const load = async () => {
    try {
      setProducts(await fetchProducts())
    } catch {
      toast.error("Impossible de charger la configuration.")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  return (
    <Container className="p-0 divide-y divide-ui-border-base">
      <div className="px-6 py-4">
        <Heading>Configurateur 3D</Heading>
        <Text size="small" className="text-ui-fg-muted">
          Couleurs et motifs de chaque produit configurable.
        </Text>
      </div>

      {loading && (
        <div className="px-6 py-8">
          <Text size="small" className="text-ui-fg-muted">Chargement…</Text>
        </div>
      )}

      {!loading && products.length === 0 && (
        <div className="px-6 py-8">
          <Text size="small" className="text-ui-fg-muted">
            Aucun produit configurable. Lance le seed « seed-configurator ».
          </Text>
        </div>
      )}

      {products.map((product) => (
        <div key={product.id} className="px-6 py-5">
          <div className="mb-3 flex items-center gap-2">
            <Heading level="h2" className="capitalize">{product.handle}</Heading>
            <Text size="xsmall" className="text-ui-fg-muted font-mono">
              {product.glb_path}
            </Text>
          </div>

          <div className="flex flex-col gap-6">
            {product.options
              .filter((o) => o.type !== "engraving")
              .map((option) => (
                <div
                  key={option.id}
                  className="rounded-lg border border-ui-border-base p-4"
                >
                  <div className="mb-2 flex items-center gap-2">
                    <Text weight="plus">{option.label}</Text>
                    <Badge size="2xsmall">{option.type}</Badge>
                    <Text size="xsmall" className="text-ui-fg-muted font-mono">
                      mesh: {JSON.stringify(option.target_mesh)}
                    </Text>
                  </div>

                  {option.choices.map((choice) => (
                    <ChoiceRow
                      key={choice.id}
                      option={option}
                      choice={choice}
                      onChanged={load}
                    />
                  ))}

                  <AddChoice option={option} onAdded={load} />
                </div>
              ))}
          </div>
        </div>
      ))}
    </Container>
  )
}

export const config = defineRouteConfig({
  label: "Configurateur",
  icon: Swatch,
})
