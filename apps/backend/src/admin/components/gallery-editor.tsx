import { useEffect, useState } from "react"
import { Button, Heading, Text, Input, Label, Switch, Badge, toast } from "@medusajs/ui"
import { ArrowUpMini, ArrowDownMini, Trash } from "@medusajs/icons"
import { ImageField } from "./common/ImageField"

// Dossier R2 dédié aux images de la galerie.
const GALLERY_FOLDERS = [{ value: "Gallery", label: "Gallery" }]
const JSON_HEADERS = { "Content-Type": "application/json" }

export type GalleryImage = {
  id: string
  src: string
  alt: string
  aspect: "portrait" | "square" | "landscape"
  col_span: number
  rank: number
  active: boolean
}

async function errorMessage(res: Response, fallback: string): Promise<string> {
  const body = await res.json().catch(() => null)
  return (body?.message as string) || fallback
}

export async function fetchImages(): Promise<GalleryImage[]> {
  const res = await fetch("/admin/gallery", { credentials: "include" })
  if (!res.ok) throw new Error("Chargement impossible.")
  const { images } = await res.json()
  return images
}

const SELECT_CLASS =
  "txt-compact-small w-full rounded-md border border-ui-border-base bg-ui-bg-field px-2 py-1.5"

function AspectSelect({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <select value={value} onChange={(e) => onChange(e.target.value)} className={SELECT_CLASS}>
      <option value="portrait">Portrait (3/4)</option>
      <option value="square">Carré (1/1)</option>
      <option value="landscape">Paysage (4/3)</option>
    </select>
  )
}

function ColSpanSelect({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  return (
    <select value={value} onChange={(e) => onChange(Number(e.target.value))} className={SELECT_CLASS}>
      <option value={1}>1 colonne</option>
      <option value={2}>2 colonnes</option>
      <option value={3}>3 colonnes</option>
    </select>
  )
}

// ─── Champs partagés (édition + ajout) ────────────────────────────────────────
function ImageFields({
  src, alt, aspect, colSpan, setSrc, setAlt, setAspect, setColSpan,
}: {
  src: string; alt: string; aspect: string; colSpan: number
  setSrc: (v: string) => void
  setAlt: (v: string) => void
  setAspect: (v: string) => void
  setColSpan: (v: number) => void
}) {
  return (
    <div className="flex flex-wrap items-start gap-4">
      <ImageField value={src} onChange={setSrc} label="Image" folders={GALLERY_FOLDERS} />
      <div className="flex-1 min-w-[14rem] flex flex-col gap-2">
        <div>
          <Label size="xsmall" className="text-ui-fg-muted">Texte alternatif</Label>
          <Input value={alt} onChange={(e) => setAlt(e.target.value)} placeholder="Description de l'image (accessibilité)" />
        </div>
        <div className="flex gap-2">
          <div className="flex-1">
            <Label size="xsmall" className="text-ui-fg-muted">Format</Label>
            <AspectSelect value={aspect} onChange={setAspect} />
          </div>
          <div className="flex-1">
            <Label size="xsmall" className="text-ui-fg-muted">Colonnes</Label>
            <ColSpanSelect value={colSpan} onChange={setColSpan} />
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Édition d'une image existante ────────────────────────────────────────────
function ImageRow({
  image, index, count, onChanged, onMove,
}: {
  image: GalleryImage
  index: number
  count: number
  onChanged: () => void
  onMove: (index: number, dir: -1 | 1) => void
}) {
  const [src, setSrc] = useState(image.src)
  const [alt, setAlt] = useState(image.alt)
  const [aspect, setAspect] = useState<string>(image.aspect)
  const [colSpan, setColSpan] = useState<number>(image.col_span ?? 1)
  const [active, setActive] = useState(image.active)
  const [busy, setBusy] = useState(false)

  const save = async () => {
    setBusy(true)
    try {
      const res = await fetch(`/admin/gallery/${image.id}`, {
        method: "PUT",
        credentials: "include",
        headers: JSON_HEADERS,
        body: JSON.stringify({ src, alt, aspect, col_span: colSpan, active }),
      })
      if (!res.ok) throw new Error(await errorMessage(res, "Échec"))
      toast.success("Image enregistrée")
      onChanged()
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Échec de l'enregistrement")
    } finally {
      setBusy(false)
    }
  }

  const remove = async () => {
    if (!confirm("Supprimer cette image de la galerie ?")) return
    setBusy(true)
    try {
      const res = await fetch(`/admin/gallery/${image.id}`, {
        method: "DELETE",
        credentials: "include",
      })
      if (!res.ok) throw new Error(await errorMessage(res, "Échec"))
      toast.success("Image supprimée")
      onChanged()
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Échec de la suppression")
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="rounded-lg border border-ui-border-base p-4">
      <div className="mb-3 flex items-center gap-2">
        <Badge size="2xsmall">#{index + 1}</Badge>
        {!active && <Badge size="2xsmall" color="grey">masquée</Badge>}
        <div className="ml-auto flex items-center gap-1">
          <Button size="small" variant="transparent" disabled={index === 0} onClick={() => onMove(index, -1)} title="Monter">
            <ArrowUpMini />
          </Button>
          <Button size="small" variant="transparent" disabled={index === count - 1} onClick={() => onMove(index, 1)} title="Descendre">
            <ArrowDownMini />
          </Button>
          <Button size="small" variant="transparent" onClick={remove} disabled={busy} className="text-ui-fg-error" title="Supprimer">
            <Trash />
          </Button>
        </div>
      </div>

      <ImageFields src={src} alt={alt} aspect={aspect} colSpan={colSpan} setSrc={setSrc} setAlt={setAlt} setAspect={setAspect} setColSpan={setColSpan} />

      <div className="mt-3 flex items-center gap-3">
        <div className="flex items-center gap-2">
          <Switch checked={active} onCheckedChange={setActive} id={`active-${image.id}`} />
          <Label size="xsmall" htmlFor={`active-${image.id}`}>Visible</Label>
        </div>
        <Button size="small" onClick={save} isLoading={busy} className="ml-auto">
          Enregistrer
        </Button>
      </div>
    </div>
  )
}

// ─── Ajout d'une image ────────────────────────────────────────────────────────
function AddImage({ nextRank, onAdded }: { nextRank: number; onAdded: () => void }) {
  const [src, setSrc] = useState("")
  const [alt, setAlt] = useState("")
  const [aspect, setAspect] = useState("portrait")
  const [colSpan, setColSpan] = useState(1)
  const [busy, setBusy] = useState(false)

  const add = async () => {
    if (!src.trim()) {
      toast.error("Ajoute d'abord une image (upload ou URL).")
      return
    }
    setBusy(true)
    try {
      const res = await fetch("/admin/gallery", {
        method: "POST",
        credentials: "include",
        headers: JSON_HEADERS,
        body: JSON.stringify({ src, alt, aspect, col_span: colSpan, rank: nextRank, active: true }),
      })
      if (!res.ok) throw new Error(await errorMessage(res, "Échec"))
      toast.success("Image ajoutée")
      setSrc(""); setAlt(""); setAspect("portrait"); setColSpan(1)
      onAdded()
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Échec de l'ajout")
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="rounded-lg border border-dashed border-ui-border-base p-4">
      <Heading level="h2" className="mb-3">Nouvelle image</Heading>
      <ImageFields src={src} alt={alt} aspect={aspect} colSpan={colSpan} setSrc={setSrc} setAlt={setAlt} setAspect={setAspect} setColSpan={setColSpan} />
      <div className="mt-3 flex justify-end">
        <Button size="small" variant="secondary" onClick={add} isLoading={busy}>
          + Ajouter l'image
        </Button>
      </div>
    </div>
  )
}

// ─── Éditeur complet ──────────────────────────────────────────────────────────
export function GalleryEditor() {
  const [images, setImages] = useState<GalleryImage[]>([])
  const [loading, setLoading] = useState(true)

  const load = async () => {
    try {
      setImages(await fetchImages())
    } catch {
      toast.error("Impossible de charger la galerie.")
    } finally {
      setLoading(false)
    }
  }
  useEffect(() => { load() }, [])

  // Réordonne en échangeant le `rank` avec le voisin.
  const move = async (index: number, dir: -1 | 1) => {
    const j = index + dir
    if (j < 0 || j >= images.length) return
    const a = images[index]
    const b = images[j]
    try {
      await Promise.all([
        fetch(`/admin/gallery/${a.id}`, {
          method: "PUT", credentials: "include", headers: JSON_HEADERS,
          body: JSON.stringify({ rank: b.rank }),
        }),
        fetch(`/admin/gallery/${b.id}`, {
          method: "PUT", credentials: "include", headers: JSON_HEADERS,
          body: JSON.stringify({ rank: a.rank }),
        }),
      ])
      load()
    } catch {
      toast.error("Échec du réordonnancement")
    }
  }

  const nextRank = images.length
    ? Math.max(...images.map((i) => i.rank ?? 0)) + 1
    : 0

  return (
    <div className="flex flex-col gap-4">
      {loading && <Text size="small" className="text-ui-fg-muted">Chargement…</Text>}
      {!loading && images.length === 0 && (
        <Text size="small" className="text-ui-fg-muted">
          Aucune image enregistrée. Ajoutes-en ci-dessous (ou lance le seed
          « seed-gallery »). Tant que la table est vide, le storefront affiche
          la galerie par défaut.
        </Text>
      )}
      {images.map((image, i) => (
        <ImageRow
          key={image.id}
          image={image}
          index={i}
          count={images.length}
          onChanged={load}
          onMove={move}
        />
      ))}
      <AddImage nextRank={nextRank} onAdded={load} />
    </div>
  )
}
