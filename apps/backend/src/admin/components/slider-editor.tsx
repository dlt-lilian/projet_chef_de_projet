import { useEffect, useState } from "react"
import { Button, Heading, Text, Input, Label, Switch, Badge, toast } from "@medusajs/ui"
import { ArrowUpMini, ArrowDownMini, Trash } from "@medusajs/icons"
import { ImageField } from "./common/ImageField"

// Dossier R2 dédié aux images du carrousel.
const SLIDER_FOLDERS = [{ value: "Slider", label: "Slider" }]
const JSON_HEADERS = { "Content-Type": "application/json" }

export type Slide = {
  id: string
  title: string
  text: string
  link: string
  img: string
  rank: number
  active: boolean
}

async function errorMessage(res: Response, fallback: string): Promise<string> {
  const body = await res.json().catch(() => null)
  return (body?.message as string) || fallback
}

export async function fetchSlides(): Promise<Slide[]> {
  const res = await fetch("/admin/slider", { credentials: "include" })
  if (!res.ok) throw new Error("Chargement impossible.")
  const { slides } = await res.json()
  return slides
}

// ─── Formulaire partagé (édition + ajout) ─────────────────────────────────────
function SlideFields({
  title, text, link, img,
  setTitle, setText, setLink, setImg,
}: {
  title: string; text: string; link: string; img: string
  setTitle: (v: string) => void
  setText: (v: string) => void
  setLink: (v: string) => void
  setImg: (v: string) => void
}) {
  return (
    <div className="flex flex-wrap items-start gap-4">
      <ImageField value={img} onChange={setImg} label="Image" folders={SLIDER_FOLDERS} />
      <div className="flex-1 min-w-[16rem] flex flex-col gap-2">
        <div>
          <Label size="xsmall" className="text-ui-fg-muted">Titre</Label>
          <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Titre du slide" />
        </div>
        <div>
          <Label size="xsmall" className="text-ui-fg-muted">Texte</Label>
          <Input value={text} onChange={(e) => setText(e.target.value)} placeholder="Sous-titre / description" />
        </div>
        <div>
          <Label size="xsmall" className="text-ui-fg-muted">Lien</Label>
          <Input value={link} onChange={(e) => setLink(e.target.value)} placeholder="/collections/printemps" className="font-mono text-xs" />
        </div>
      </div>
    </div>
  )
}

// ─── Édition d'un slide existant ──────────────────────────────────────────────
function SlideRow({
  slide, index, count, onChanged, onMove,
}: {
  slide: Slide
  index: number
  count: number
  onChanged: () => void
  onMove: (index: number, dir: -1 | 1) => void
}) {
  const [title, setTitle] = useState(slide.title)
  const [text, setText] = useState(slide.text)
  const [link, setLink] = useState(slide.link)
  const [img, setImg] = useState(slide.img)
  const [active, setActive] = useState(slide.active)
  const [busy, setBusy] = useState(false)

  const save = async () => {
    setBusy(true)
    try {
      const res = await fetch(`/admin/slider/${slide.id}`, {
        method: "PUT",
        credentials: "include",
        headers: JSON_HEADERS,
        body: JSON.stringify({ title, text, link, img, active }),
      })
      if (!res.ok) throw new Error(await errorMessage(res, "Échec"))
      toast.success("Slide enregistré")
      onChanged()
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Échec de l'enregistrement")
    } finally {
      setBusy(false)
    }
  }

  const remove = async () => {
    if (!confirm(`Supprimer ce slide (« ${slide.title || "sans titre"} ») ?`)) return
    setBusy(true)
    try {
      const res = await fetch(`/admin/slider/${slide.id}`, {
        method: "DELETE",
        credentials: "include",
      })
      if (!res.ok) throw new Error(await errorMessage(res, "Échec"))
      toast.success("Slide supprimé")
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
        {!active && <Badge size="2xsmall" color="grey">masqué</Badge>}
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

      <SlideFields
        title={title} text={text} link={link} img={img}
        setTitle={setTitle} setText={setText} setLink={setLink} setImg={setImg}
      />

      <div className="mt-3 flex items-center gap-3">
        <div className="flex items-center gap-2">
          <Switch checked={active} onCheckedChange={setActive} id={`active-${slide.id}`} />
          <Label size="xsmall" htmlFor={`active-${slide.id}`}>Visible</Label>
        </div>
        <Button size="small" onClick={save} isLoading={busy} className="ml-auto">
          Enregistrer
        </Button>
      </div>
    </div>
  )
}

// ─── Ajout d'un slide ─────────────────────────────────────────────────────────
function AddSlide({ nextRank, onAdded }: { nextRank: number; onAdded: () => void }) {
  const [title, setTitle] = useState("")
  const [text, setText] = useState("")
  const [link, setLink] = useState("")
  const [img, setImg] = useState("")
  const [busy, setBusy] = useState(false)

  const add = async () => {
    setBusy(true)
    try {
      const res = await fetch("/admin/slider", {
        method: "POST",
        credentials: "include",
        headers: JSON_HEADERS,
        body: JSON.stringify({ title, text, link, img, rank: nextRank, active: true }),
      })
      if (!res.ok) throw new Error(await errorMessage(res, "Échec"))
      toast.success("Slide ajouté")
      setTitle(""); setText(""); setLink(""); setImg("")
      onAdded()
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Échec de l'ajout")
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="rounded-lg border border-dashed border-ui-border-base p-4">
      <Heading level="h2" className="mb-3">Nouveau slide</Heading>
      <SlideFields
        title={title} text={text} link={link} img={img}
        setTitle={setTitle} setText={setText} setLink={setLink} setImg={setImg}
      />
      <div className="mt-3 flex justify-end">
        <Button size="small" variant="secondary" onClick={add} isLoading={busy}>
          + Ajouter le slide
        </Button>
      </div>
    </div>
  )
}

// ─── Éditeur complet ──────────────────────────────────────────────────────────
export function SliderEditor() {
  const [slides, setSlides] = useState<Slide[]>([])
  const [loading, setLoading] = useState(true)

  const load = async () => {
    try {
      setSlides(await fetchSlides())
    } catch {
      toast.error("Impossible de charger les slides.")
    } finally {
      setLoading(false)
    }
  }
  useEffect(() => { load() }, [])

  // Réordonne en échangeant le `rank` avec le voisin (les rangs restent distincts).
  const move = async (index: number, dir: -1 | 1) => {
    const j = index + dir
    if (j < 0 || j >= slides.length) return
    const a = slides[index]
    const b = slides[j]
    try {
      await Promise.all([
        fetch(`/admin/slider/${a.id}`, {
          method: "PUT", credentials: "include", headers: JSON_HEADERS,
          body: JSON.stringify({ rank: b.rank }),
        }),
        fetch(`/admin/slider/${b.id}`, {
          method: "PUT", credentials: "include", headers: JSON_HEADERS,
          body: JSON.stringify({ rank: a.rank }),
        }),
      ])
      load()
    } catch {
      toast.error("Échec du réordonnancement")
    }
  }

  const nextRank = slides.length
    ? Math.max(...slides.map((s) => s.rank ?? 0)) + 1
    : 0

  return (
    <div className="flex flex-col gap-4">
      {loading && <Text size="small" className="text-ui-fg-muted">Chargement…</Text>}
      {!loading && slides.length === 0 && (
        <Text size="small" className="text-ui-fg-muted">
          Aucun slide enregistré. Ajoute-en un ci-dessous (ou lance le seed
          « seed-slider »). Tant que la table est vide, le storefront affiche
          les slides par défaut.
        </Text>
      )}
      {slides.map((slide, i) => (
        <SlideRow
          key={slide.id}
          slide={slide}
          index={i}
          count={slides.length}
          onChanged={load}
          onMove={move}
        />
      ))}
      <AddSlide nextRank={nextRank} onAdded={load} />
    </div>
  )
}
