import { useState } from "react"
import { Button, Input, Textarea, Select, Label, Text, Badge } from "@medusajs/ui"
import {
  PlusMini,
  Trash,
  ArrowUpMini,
  ArrowDownMini,
  Photo,
  DocumentText,
  ChatBubbleLeftRight,
  BarsThree,
  SquaresPlus,
} from "@medusajs/icons"

// ─── Types ────────────────────────────────────────────────────────────────────

type Block =
  | { type: "banner";    img: string; alt: string; title?: string; subtitle?: string }
  | { type: "titre";     level: 1 | 2 | 3; text: string }
  | { type: "texte";     content: string; dropcap?: boolean }
  | { type: "img";       src: string; alt: string; caption?: string; fullWidth?: boolean }
  | { type: "doubleimg"; images: [{ src: string; alt: string; caption?: string }, { src: string; alt: string; caption?: string }] }

type BlockBuilderProps = {
  value: Block[]
  onChange: (blocks: Block[]) => void
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const BLOCK_LABELS: Record<string, string> = {
  banner:    "Bannière",
  titre:     "Titre",
  texte:     "Texte",
  img:       "Image",
  doubleimg: "Double image",
}

const BLOCK_ICONS: Record<string, React.ReactNode> = {
  banner:    <Photo className="w-4 h-4" />,
  titre:     <BarsThree className="w-4 h-4" />,
  texte:     <ChatBubbleLeftRight className="w-4 h-4" />,
  img:       <DocumentText className="w-4 h-4" />,
  doubleimg: <SquaresPlus className="w-4 h-4" />,
}

function defaultBlock(type: string): Block {
  switch (type) {
    case "banner":    return { type: "banner",    img: "", alt: "", title: "", subtitle: "" }
    case "titre":     return { type: "titre",     level: 2, text: "" }
    case "texte":     return { type: "texte",     content: "", dropcap: false }
    case "img":       return { type: "img",       src: "", alt: "", caption: "", fullWidth: false }
    case "doubleimg": return { type: "doubleimg", images: [{ src: "", alt: "", caption: "" }, { src: "", alt: "", caption: "" }] }
    default:          return { type: "texte",     content: "" }
  }
}

// ─── Sous-éditeurs par type ───────────────────────────────────────────────────

function BannerEditor({ block, onChange }: { block: Extract<Block, { type: "banner" }>; onChange: (b: Block) => void }) {
  return (
    <div className="grid grid-cols-2 gap-3">
      <div className="col-span-2">
        <Label size="xsmall">URL de l'image *</Label>
        <Input size="small" value={block.img}      onChange={e => onChange({ ...block, img:      e.target.value })} placeholder="/images/banner.jpg" />
      </div>
      <div>
        <Label size="xsmall">Texte alternatif *</Label>
        <Input size="small" value={block.alt}      onChange={e => onChange({ ...block, alt:      e.target.value })} placeholder="Description de l'image" />
      </div>
      <div>
        <Label size="xsmall">Sous-titre (optionnel)</Label>
        <Input size="small" value={block.subtitle} onChange={e => onChange({ ...block, subtitle: e.target.value })} placeholder="Ex : Voyage — Japon" />
      </div>
      <div className="col-span-2">
        <Label size="xsmall">Titre overlay (optionnel)</Label>
        <Input size="small" value={block.title}    onChange={e => onChange({ ...block, title:    e.target.value })} placeholder="Grand titre visible sur l'image" />
      </div>
    </div>
  )
}

function TitleEditor({ block, onChange }: { block: Extract<Block, { type: "titre" }>; onChange: (b: Block) => void }) {
  return (
    <div className="grid grid-cols-4 gap-3">
      <div>
        <Label size="xsmall">Niveau</Label>
        <Select value={String(block.level)} onValueChange={v => onChange({ ...block, level: parseInt(v) as 1 | 2 | 3 })}>
          <Select.Trigger><Select.Value /></Select.Trigger>
          <Select.Content>
            <Select.Item value="1">H1</Select.Item>
            <Select.Item value="2">H2</Select.Item>
            <Select.Item value="3">H3</Select.Item>
          </Select.Content>
        </Select>
      </div>
      <div className="col-span-3">
        <Label size="xsmall">Texte du titre *</Label>
        <Input size="small" value={block.text} onChange={e => onChange({ ...block, text: e.target.value })} placeholder="Mon titre de section" />
      </div>
    </div>
  )
}

function TextEditor({ block, onChange }: { block: Extract<Block, { type: "texte" }>; onChange: (b: Block) => void }) {
  return (
    <div className="space-y-2">
      <Label size="xsmall">Contenu (HTML accepté) *</Label>
      <Textarea
        rows={4}
        value={block.content}
        onChange={e => onChange({ ...block, content: e.target.value })}
        placeholder="Texte du paragraphe... <strong>gras</strong> <em>italique</em>"
        className="text-sm font-mono"
      />
      <label className="flex items-center gap-2 cursor-pointer">
        <input
          type="checkbox"
          checked={block.dropcap ?? false}
          onChange={e => onChange({ ...block, dropcap: e.target.checked })}
          className="rounded"
        />
        <Text size="small" className="text-ui-fg-subtle">Lettrine sur la première lettre</Text>
      </label>
    </div>
  )
}

function ImgEditor({ block, onChange }: { block: Extract<Block, { type: "img" }>; onChange: (b: Block) => void }) {
  return (
    <div className="grid grid-cols-2 gap-3">
      <div className="col-span-2">
        <Label size="xsmall">URL de l'image *</Label>
        <Input size="small" value={block.src}     onChange={e => onChange({ ...block, src:       e.target.value })} placeholder="/images/photo.jpg" />
      </div>
      <div>
        <Label size="xsmall">Texte alternatif *</Label>
        <Input size="small" value={block.alt}     onChange={e => onChange({ ...block, alt:       e.target.value })} placeholder="Description" />
      </div>
      <div>
        <Label size="xsmall">Légende (optionnel)</Label>
        <Input size="small" value={block.caption} onChange={e => onChange({ ...block, caption:   e.target.value })} placeholder="Légende sous l'image" />
      </div>
      <label className="col-span-2 flex items-center gap-2 cursor-pointer">
        <input
          type="checkbox"
          checked={block.fullWidth ?? false}
          onChange={e => onChange({ ...block, fullWidth: e.target.checked })}
          className="rounded"
        />
        <Text size="small" className="text-ui-fg-subtle">Image pleine largeur (sort de la colonne)</Text>
      </label>
    </div>
  )
}

function DoubleImgEditor({ block, onChange }: { block: Extract<Block, { type: "doubleimg" }>; onChange: (b: Block) => void }) {
  const update = (idx: 0 | 1, field: string, val: string) => {
    const images = [...block.images] as typeof block.images
    images[idx] = { ...images[idx], [field]: val }
    onChange({ ...block, images })
  }

  return (
    <div className="grid grid-cols-2 gap-x-6 gap-y-3">
      {(["Gauche", "Droite"] as const).map((label, idx) => (
        <div key={idx} className="space-y-2">
          <Text size="small" weight="plus" className="text-ui-fg-subtle">{label}</Text>
          <div>
            <Label size="xsmall">URL *</Label>
            <Input size="small" value={block.images[idx as 0|1].src}     onChange={e => update(idx as 0|1, "src",     e.target.value)} placeholder="/images/photo.jpg" />
          </div>
          <div>
            <Label size="xsmall">Alt *</Label>
            <Input size="small" value={block.images[idx as 0|1].alt}     onChange={e => update(idx as 0|1, "alt",     e.target.value)} placeholder="Description" />
          </div>
          <div>
            <Label size="xsmall">Légende</Label>
            <Input size="small" value={block.images[idx as 0|1].caption} onChange={e => update(idx as 0|1, "caption", e.target.value)} placeholder="Légende..." />
          </div>
        </div>
      ))}
    </div>
  )
}

function BlockEditor({ block, onChange }: { block: Block; onChange: (b: Block) => void }) {
  switch (block.type) {
    case "banner":    return <BannerEditor    block={block} onChange={onChange} />
    case "titre":     return <TitleEditor     block={block} onChange={onChange} />
    case "texte":     return <TextEditor      block={block} onChange={onChange} />
    case "img":       return <ImgEditor       block={block} onChange={onChange} />
    case "doubleimg": return <DoubleImgEditor block={block} onChange={onChange} />
  }
}

// ─── BlockBuilder principal ───────────────────────────────────────────────────

export default function BlockBuilder({ value, onChange }: BlockBuilderProps) {
  const [collapsed, setCollapsed] = useState<Record<number, boolean>>({})

  const addBlock = (type: string) => {
    onChange([...value, defaultBlock(type)])
  }

  const updateBlock = (i: number, block: Block) => {
    const next = [...value]
    next[i] = block
    onChange(next)
  }

  const removeBlock = (i: number) => {
    onChange(value.filter((_, idx) => idx !== i))
  }

  const moveBlock = (i: number, dir: -1 | 1) => {
    const next = [...value]
    const j = i + dir
    if (j < 0 || j >= next.length) return
    ;[next[i], next[j]] = [next[j], next[i]]
    onChange(next)
  }

  const toggleCollapse = (i: number) => {
    setCollapsed(prev => ({ ...prev, [i]: !prev[i] }))
  }

  return (
    <div className="space-y-3">

      {/* ── Liste des blocs ── */}
      {value.length === 0 && (
        <div className="border border-dashed border-ui-border-base rounded-lg p-8 text-center">
          <Text size="small" className="text-ui-fg-muted">
            Aucun bloc. Ajoute ton premier bloc ci-dessous.
          </Text>
        </div>
      )}

      {value.map((block, i) => (
        <div
          key={i}
          className="border border-ui-border-base rounded-lg bg-ui-bg-base overflow-hidden"
        >
          {/* Header du bloc */}
          <div
            className="flex items-center gap-3 px-4 py-2.5 bg-ui-bg-subtle cursor-pointer select-none"
            onClick={() => toggleCollapse(i)}
          >
            <span className="text-ui-fg-muted">{BLOCK_ICONS[block.type]}</span>
            <div className="flex-1 flex items-center gap-2">
              <Badge size="2xsmall" color="grey">{BLOCK_LABELS[block.type]}</Badge>
              {block.type === "titre" && (
                <Text size="xsmall" className="text-ui-fg-muted truncate max-w-xs">
                  {block.text || "—"}
                </Text>
              )}
              {block.type === "texte" && (
                <Text size="xsmall" className="text-ui-fg-muted truncate max-w-xs">
                  {block.content.replace(/<[^>]+>/g, "").slice(0, 60) || "—"}
                </Text>
              )}
            </div>

            {/* Contrôles */}
            <div className="flex items-center gap-1" onClick={e => e.stopPropagation()}>
              <Button
                variant="transparent"
                size="small"
                onClick={() => moveBlock(i, -1)}
                disabled={i === 0}
                title="Monter"
              >
                <ArrowUpMini />
              </Button>
              <Button
                variant="transparent"
                size="small"
                onClick={() => moveBlock(i, 1)}
                disabled={i === value.length - 1}
                title="Descendre"
              >
                <ArrowDownMini />
              </Button>
              <Button
                variant="transparent"
                size="small"
                onClick={() => removeBlock(i)}
                title="Supprimer"
                className="text-ui-fg-error hover:text-ui-fg-error"
              >
                <Trash />
              </Button>
            </div>
          </div>

          {/* Corps du bloc */}
          {!collapsed[i] && (
            <div className="p-4">
              <BlockEditor block={block} onChange={b => updateBlock(i, b)} />
            </div>
          )}
        </div>
      ))}

      {/* ── Boutons d'ajout ── */}
      <div className="flex flex-wrap gap-2 pt-2">
        <Text size="small" className="text-ui-fg-muted self-center mr-1">
          Ajouter :
        </Text>
        {Object.entries(BLOCK_LABELS).map(([type, label]) => (
          <Button
            key={type}
            variant="secondary"
            size="small"
            onClick={() => addBlock(type)}
          >
            <PlusMini className="mr-1" />
            {label}
          </Button>
        ))}
      </div>
    </div>
  )
}
