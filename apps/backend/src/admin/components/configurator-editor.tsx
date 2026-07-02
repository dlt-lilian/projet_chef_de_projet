import { useEffect, useRef, useState, type ChangeEvent } from "react"
import { Button, Heading, Text, Input, Label, Badge, toast } from "@medusajs/ui"

// ─── Types ──────────────────────────────────────────────────────────────────
export type Choice = {
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
export type OptionType = "color" | "texture" | "motif" | "engraving"
export type Option = {
  id: string
  option_key: string
  label: string
  type: OptionType
  target_mesh?: string | string[] | null
  rank: number
  choices: Choice[]
}
export type Product = {
  id: string
  handle: string
  glb_path: string
  auto_rotate: boolean
  model_rotation_deg?: number[] | null
  options: Option[]
}
// Noms disponibles dans le .glb (pour le menu de target_mesh).
export type MeshNames = { objects: string[]; materials: string[] }

// ─── API helpers ──────────────────────────────────────────────────────────────
const JSON_HEADERS = { "Content-Type": "application/json" }

export async function fetchProducts(): Promise<Product[]> {
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

function formatTargetMesh(value?: string | string[] | null): string {
  if (!value) return ""
  return Array.isArray(value) ? value.join(", ") : value
}

function parseTargetMesh(raw: string): string | string[] | null {
  const trimmed = raw.trim()
  if (!trimmed) return null
  if (trimmed.includes(",")) {
    return trimmed
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean)
  }
  return trimmed
}

async function errorMessage(res: Response, fallback: string): Promise<string> {
  const body = await res.json().catch(() => null)
  return (body?.message as string) || fallback
}

// ─── Upload d'un fichier vers R2 (/admin/uploads) → renvoie l'URL publique ─────
function useR2Upload() {
  const [uploading, setUploading] = useState(false)
  const upload = async (file: File): Promise<string | null> => {
    setUploading(true)
    try {
      const form = new FormData()
      form.append("files", file)
      // Pas de Content-Type manuel : le navigateur pose le boundary multipart.
      const res = await fetch("/admin/uploads", {
        method: "POST",
        credentials: "include",
        body: form,
      })
      if (!res.ok) throw new Error(await errorMessage(res, "Échec de l'upload"))
      const data = await res.json()
      const url = data?.files?.[0]?.url as string | undefined
      if (!url) throw new Error("Réponse d'upload inattendue")
      toast.success("Fichier envoyé")
      return url
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Échec de l'upload")
      return null
    } finally {
      setUploading(false)
    }
  }
  return { upload, uploading }
}

// ─── Bouton d'upload d'un modèle .glb vers R2 ──────────────────────────────────
function GlbUploadButton({ onUploaded }: { onUploaded: (url: string) => void }) {
  const inputRef = useRef<HTMLInputElement>(null)
  const { upload, uploading } = useR2Upload()
  return (
    <>
      <input
        ref={inputRef}
        type="file"
        accept=".glb,.gltf,model/gltf-binary"
        className="hidden"
        onChange={async (e: ChangeEvent<HTMLInputElement>) => {
          const file = e.target.files?.[0]
          if (!file) return
          const url = await upload(file)
          if (url) onUploaded(url)
          if (inputRef.current) inputRef.current.value = ""
        }}
      />
      <Button
        size="small"
        variant="secondary"
        type="button"
        isLoading={uploading}
        onClick={() => inputRef.current?.click()}
      >
        Upload .glb
      </Button>
    </>
  )
}

// ─── Champ image : upload vers R2 + aperçu + URL manuelle ──────────────────────
function ImageField({
  value,
  onChange,
  label,
}: {
  value: string
  onChange: (v: string) => void
  label: string
}) {
  const inputRef = useRef<HTMLInputElement>(null)
  const { upload, uploading } = useR2Upload()

  const onFile = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const url = await upload(file)
    if (url) onChange(url)
    if (inputRef.current) inputRef.current.value = ""
  }

  return (
    <div className="w-72">
      <Label size="xsmall" className="text-ui-fg-muted">{label}</Label>
      <div className="flex items-center gap-2">
        {value ? (
          <img
            src={value}
            alt=""
            className="h-9 w-9 shrink-0 rounded border border-ui-border-base object-cover"
          />
        ) : (
          <div className="h-9 w-9 shrink-0 rounded border border-dashed border-ui-border-base" />
        )}
        <Input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="https://… ou /3d/…"
          className="flex-1 font-mono text-xs"
        />
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={onFile}
        />
        <Button
          size="small"
          variant="secondary"
          type="button"
          onClick={() => inputRef.current?.click()}
          isLoading={uploading}
        >
          Upload
        </Button>
      </div>
    </div>
  )
}

// ─── Sélecteur de meshes ciblés : champ texte (CSV) + puces cliquables ─────────
function MeshSelect({
  value,
  onChange,
  available,
}: {
  value: string
  onChange: (v: string) => void
  available: MeshNames | null
}) {
  const selected = value
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean)

  const toggle = (name: string) => {
    const set = new Set(selected)
    if (set.has(name)) set.delete(name)
    else set.add(name)
    onChange([...set].join(", "))
  }

  const Chip = ({ name }: { name: string }) => {
    const on = selected.includes(name)
    return (
      <button
        type="button"
        onClick={() => toggle(name)}
        className={`rounded border px-2 py-0.5 text-xs ${
          on
            ? "border-ui-fg-interactive bg-ui-bg-interactive text-ui-fg-on-color"
            : "border-ui-border-base bg-ui-bg-subtle text-ui-fg-subtle"
        }`}
      >
        {name}
      </button>
    )
  }

  const hasNames =
    !!available &&
    (available.objects.length > 0 || available.materials.length > 0)

  return (
    <div className="w-72">
      <Label size="xsmall" className="text-ui-fg-muted">Mesh(es) ciblé(s)</Label>
      <Input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Papier ou vis_1, vis_2"
        className="font-mono text-xs"
      />
      {hasNames && (
        <div className="mt-1 flex flex-col gap-1">
          {available!.objects.length > 0 && (
            <div className="flex flex-wrap items-center gap-1">
              <span className="text-[10px] uppercase text-ui-fg-muted">Objets</span>
              {available!.objects.map((n) => (
                <Chip key={`o-${n}`} name={n} />
              ))}
            </div>
          )}
          {available!.materials.length > 0 && (
            <div className="flex flex-wrap items-center gap-1">
              <span className="text-[10px] uppercase text-ui-fg-muted">Matériaux</span>
              {available!.materials.map((n) => (
                <Chip key={`m-${n}`} name={n} />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// ─── En-tête produit (glb, rotation) ──────────────────────────────────────────
function ProductHeader({
  product,
  onChanged,
}: {
  product: Product
  onChanged: () => void
}) {
  const [glbPath, setGlbPath] = useState(product.glb_path)
  const [autoRotate, setAutoRotate] = useState(product.auto_rotate ?? true)
  const [rotation, setRotation] = useState(
    product.model_rotation_deg?.join(", ") ?? ""
  )
  const [busy, setBusy] = useState(false)

  const save = async () => {
    setBusy(true)
    try {
      const parts = rotation
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean)
        .map(Number)
      const model_rotation_deg =
        parts.length === 3 && parts.every((n) => !Number.isNaN(n))
          ? parts
          : null
      const res = await fetch(`/admin/configurator/products/${product.id}`, {
        method: "PUT",
        credentials: "include",
        headers: JSON_HEADERS,
        body: JSON.stringify({
          glb_path: glbPath,
          auto_rotate: autoRotate,
          model_rotation_deg,
        }),
      })
      if (!res.ok) throw new Error(await errorMessage(res, "Échec"))
      toast.success("Produit enregistré")
      onChanged()
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Échec de l'enregistrement")
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="mb-4 flex items-end gap-3 flex-wrap">
      <div className="w-64">
        <Label size="xsmall" className="text-ui-fg-muted">Chemin du .glb</Label>
        <Input
          value={glbPath}
          onChange={(e) => setGlbPath(e.target.value)}
          className="font-mono text-xs"
        />
      </div>
      <div className="pb-0.5">
        <GlbUploadButton onUploaded={setGlbPath} />
      </div>
      <div className="flex items-center gap-2 pb-1.5">
        <input
          type="checkbox"
          checked={autoRotate}
          onChange={(e) => setAutoRotate(e.target.checked)}
          id={`autorotate-${product.id}`}
        />
        <Label size="xsmall" htmlFor={`autorotate-${product.id}`}>
          Rotation auto
        </Label>
      </div>
      <div className="w-48">
        <Label size="xsmall" className="text-ui-fg-muted">
          Orientation initiale (x, y, z °)
        </Label>
        <Input
          value={rotation}
          onChange={(e) => setRotation(e.target.value)}
          placeholder="0, 90, 0"
          className="font-mono text-xs"
        />
      </div>
      <Button size="small" variant="secondary" onClick={save} isLoading={busy}>
        Enregistrer le produit
      </Button>
    </div>
  )
}

// ─── Édition d'une option existante ──────────────────────────────────────────
function OptionRow({
  option,
  meshes,
  onChanged,
  onDeleted,
}: {
  option: Option
  meshes: MeshNames | null
  onChanged: () => void
  onDeleted: () => void
}) {
  const [label, setLabel] = useState(option.label)
  const [optionKey, setOptionKey] = useState(option.option_key)
  const [type, setType] = useState<OptionType>(option.type)
  const [targetMesh, setTargetMesh] = useState(
    formatTargetMesh(option.target_mesh)
  )
  const [rank, setRank] = useState(String(option.rank ?? 0))
  const [busy, setBusy] = useState(false)

  const save = async () => {
    setBusy(true)
    try {
      const res = await fetch(`/admin/configurator/options/${option.id}`, {
        method: "PUT",
        credentials: "include",
        headers: JSON_HEADERS,
        body: JSON.stringify({
          option_key: optionKey,
          label,
          type,
          target_mesh: parseTargetMesh(targetMesh),
          rank: Number(rank),
        }),
      })
      if (!res.ok) throw new Error(await errorMessage(res, "Échec"))
      toast.success(`Option « ${label} » enregistrée`)
      onChanged()
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Échec de l'enregistrement")
    } finally {
      setBusy(false)
    }
  }

  const remove = async () => {
    if (
      !confirm(
        `Supprimer l'option « ${option.label} » et tous ses choix ? Cette action est définitive.`
      )
    ) {
      return
    }
    setBusy(true)
    try {
      const res = await fetch(`/admin/configurator/options/${option.id}`, {
        method: "DELETE",
        credentials: "include",
      })
      if (!res.ok) throw new Error(await errorMessage(res, "Échec"))
      toast.success("Option supprimée")
      onDeleted()
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Échec de la suppression")
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="mb-2 flex items-end gap-3 flex-wrap">
      <div className="w-40">
        <Label size="xsmall" className="text-ui-fg-muted">Label</Label>
        <Input value={label} onChange={(e) => setLabel(e.target.value)} />
      </div>
      <div className="w-32">
        <Label size="xsmall" className="text-ui-fg-muted">Clé (option_key)</Label>
        <Input
          value={optionKey}
          onChange={(e) => setOptionKey(e.target.value)}
          className="font-mono text-xs"
        />
      </div>
      <div className="w-32">
        <Label size="xsmall" className="text-ui-fg-muted">Type</Label>
        <select
          value={type}
          onChange={(e) => setType(e.target.value as OptionType)}
          className="txt-compact-small w-full rounded-md border border-ui-border-base bg-ui-bg-field px-2 py-1.5"
        >
          <option value="color">color</option>
          <option value="texture">texture</option>
          <option value="motif">motif</option>
          <option value="engraving">engraving</option>
        </select>
      </div>
      <MeshSelect value={targetMesh} onChange={setTargetMesh} available={meshes} />
      <div className="w-16">
        <Label size="xsmall" className="text-ui-fg-muted">Rang</Label>
        <Input
          type="number"
          value={rank}
          onChange={(e) => setRank(e.target.value)}
        />
      </div>
      <div className="flex items-center gap-2 pb-0.5">
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
          Suppr. option
        </Button>
      </div>
    </div>
  )
}

// ─── Ajout d'une option ───────────────────────────────────────────────────────
function AddOption({
  productId,
  meshes,
  existingCount,
  onAdded,
}: {
  productId: string
  meshes: MeshNames | null
  existingCount: number
  onAdded: () => void
}) {
  const [label, setLabel] = useState("")
  const [type, setType] = useState<OptionType>("color")
  const [targetMesh, setTargetMesh] = useState("")
  const [busy, setBusy] = useState(false)

  const add = async () => {
    if (!label.trim()) {
      toast.error("Le label est obligatoire.")
      return
    }
    setBusy(true)
    try {
      const res = await fetch("/admin/configurator/options", {
        method: "POST",
        credentials: "include",
        headers: JSON_HEADERS,
        body: JSON.stringify({
          product_id: productId,
          option_key: slugify(label) || `option-${Date.now()}`,
          label,
          type,
          target_mesh: parseTargetMesh(targetMesh),
          rank: existingCount,
        }),
      })
      if (!res.ok) throw new Error(await errorMessage(res, "Échec"))
      toast.success(`Option « ${label} » ajoutée`)
      setLabel("")
      setTargetMesh("")
      onAdded()
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Échec de l'ajout")
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="flex items-end gap-3 flex-wrap rounded-lg border border-dashed border-ui-border-base p-4">
      <div className="w-40">
        <Label size="xsmall" className="text-ui-fg-muted">
          Nouvelle option — label
        </Label>
        <Input
          value={label}
          onChange={(e) => setLabel(e.target.value)}
          placeholder="Ex. Couleur du manche"
        />
      </div>
      <div className="w-32">
        <Label size="xsmall" className="text-ui-fg-muted">Type</Label>
        <select
          value={type}
          onChange={(e) => setType(e.target.value as OptionType)}
          className="txt-compact-small w-full rounded-md border border-ui-border-base bg-ui-bg-field px-2 py-1.5"
        >
          <option value="color">color</option>
          <option value="texture">texture</option>
          <option value="motif">motif</option>
          <option value="engraving">engraving</option>
        </select>
      </div>
      <MeshSelect value={targetMesh} onChange={setTargetMesh} available={meshes} />
      <Button size="small" variant="secondary" onClick={add} isLoading={busy}>
        + Ajouter l'option
      </Button>
    </div>
  )
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
        <ImageField
          value={texture}
          onChange={setTexture}
          label={`Image ${option.type === "motif" ? "(motif)" : "(texture)"}`}
        />
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
        <ImageField
          value={texture}
          onChange={setTexture}
          label={`Image ${option.type === "motif" ? "(motif)" : "(texture)"}`}
        />
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

// ─── Bloc d'édition complet d'un produit (réutilisé page + widget) ─────────────
export function ProductConfigBlock({
  product,
  onChanged,
}: {
  product: Product
  onChanged: () => void
}) {
  // Liste des meshes/matériaux du .glb, chargée une seule fois par produit et
  // partagée par toutes les options (pour le menu de target_mesh).
  const [meshes, setMeshes] = useState<MeshNames | null>(null)
  useEffect(() => {
    if (!product.glb_path) {
      setMeshes(null)
      return
    }
    let cancelled = false
    fetch(
      `/admin/configurator/meshes?glb=${encodeURIComponent(product.glb_path)}`,
      { credentials: "include" }
    )
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (!cancelled) setMeshes(d)
      })
      .catch(() => {
        if (!cancelled) setMeshes(null)
      })
    return () => {
      cancelled = true
    }
  }, [product.glb_path])

  return (
    <>
      <ProductHeader product={product} onChanged={onChanged} />

      <div className="flex flex-col gap-6">
        {product.options.map((option) => (
          <div
            key={option.id}
            className="rounded-lg border border-ui-border-base p-4"
          >
            <div className="mb-2 flex items-center gap-2">
              <Badge size="2xsmall">{option.type}</Badge>
            </div>

            <OptionRow
              option={option}
              meshes={meshes}
              onChanged={onChanged}
              onDeleted={onChanged}
            />

            {option.type !== "engraving" && (
              <>
                {option.choices.map((choice) => (
                  <ChoiceRow
                    key={choice.id}
                    option={option}
                    choice={choice}
                    onChanged={onChanged}
                  />
                ))}

                <AddChoice option={option} onAdded={onChanged} />
              </>
            )}
          </div>
        ))}

        <AddOption
          productId={product.id}
          meshes={meshes}
          existingCount={product.options.length}
          onAdded={onChanged}
        />
      </div>
    </>
  )
}

// ─── Ajout d'un produit configurable (section dédiée) ──────────────────────────
export function AddProduct({ onAdded }: { onAdded: () => void }) {
  const [handle, setHandle] = useState("")
  const [glbPath, setGlbPath] = useState("")
  const [busy, setBusy] = useState(false)

  const add = async () => {
    if (!handle.trim() || !glbPath.trim()) {
      toast.error("Handle et chemin .glb sont obligatoires.")
      return
    }
    setBusy(true)
    try {
      const res = await fetch("/admin/configurator/products", {
        method: "POST",
        credentials: "include",
        headers: JSON_HEADERS,
        body: JSON.stringify({ handle, glb_path: glbPath }),
      })
      if (!res.ok) throw new Error(await errorMessage(res, "Échec de la création"))
      toast.success(`Produit « ${handle} » créé`)
      setHandle("")
      setGlbPath("")
      onAdded()
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Échec de la création")
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="px-6 py-5">
      <Heading level="h2">Nouveau produit configurable</Heading>
      <Text size="small" className="text-ui-fg-muted mb-3">
        Dépose le fichier .glb (upload vers R2) ou référence un chemin
        statique existant dans apps/storefront/public/3d/.
      </Text>
      <div className="flex items-end gap-3 flex-wrap">
        <div className="w-40">
          <Label size="xsmall" className="text-ui-fg-muted">
            Handle produit Medusa
          </Label>
          <Input
            value={handle}
            onChange={(e) => setHandle(e.target.value)}
            placeholder="Ex. lampe"
          />
        </div>
        <div className="w-64">
          <Label size="xsmall" className="text-ui-fg-muted">Chemin / URL du .glb</Label>
          <Input
            value={glbPath}
            onChange={(e) => setGlbPath(e.target.value)}
            placeholder="/3d/lampe/lampe.glb"
            className="font-mono text-xs"
          />
        </div>
        <div className="pb-0.5">
          <GlbUploadButton onUploaded={setGlbPath} />
        </div>
        <Button size="small" variant="secondary" onClick={add} isLoading={busy}>
          + Créer le produit
        </Button>
      </div>
    </div>
  )
}

// ─── Activation du configurateur pour un handle donné (widget fiche produit) ───
export function CreateForHandle({
  handle,
  onCreated,
}: {
  handle: string
  onCreated: () => void
}) {
  const [glbPath, setGlbPath] = useState("")
  const [busy, setBusy] = useState(false)

  const create = async () => {
    if (!glbPath.trim()) {
      toast.error("Le chemin / l'URL du .glb est obligatoire.")
      return
    }
    setBusy(true)
    try {
      const res = await fetch("/admin/configurator/products", {
        method: "POST",
        credentials: "include",
        headers: JSON_HEADERS,
        body: JSON.stringify({ handle, glb_path: glbPath }),
      })
      if (!res.ok) throw new Error(await errorMessage(res, "Échec de la création"))
      toast.success("Configurateur activé pour ce produit")
      onCreated()
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Échec de la création")
    } finally {
      setBusy(false)
    }
  }

  return (
    <div>
      <Text size="small" className="text-ui-fg-muted mb-3">
        Ce produit n'a pas encore de configurateur 3D. Uploade son modèle .glb
        (ou renseigne un chemin statique) pour l'activer.
      </Text>
      <div className="flex items-end gap-3 flex-wrap">
        <div className="w-64">
          <Label size="xsmall" className="text-ui-fg-muted">Chemin / URL du .glb</Label>
          <Input
            value={glbPath}
            onChange={(e) => setGlbPath(e.target.value)}
            placeholder={`/3d/${handle}/${handle}.glb`}
            className="font-mono text-xs"
          />
        </div>
        <div className="pb-0.5">
          <GlbUploadButton onUploaded={setGlbPath} />
        </div>
        <Button size="small" variant="secondary" onClick={create} isLoading={busy}>
          + Activer le configurateur
        </Button>
      </div>
    </div>
  )
}
