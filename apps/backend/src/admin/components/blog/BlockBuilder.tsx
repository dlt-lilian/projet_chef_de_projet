import { useState } from "react"
import { Button, Input, Textarea, Select, Label, Text, Badge } from "@medusajs/ui"
import {
  PlusMini,
  Trash,
  XMarkMini,
  ArrowUpMini,
  ArrowDownMini,
  Photo,
  DocumentText,
  ChatBubbleLeftRight,
  BarsThree,
  SquaresPlus,
  GridList,
} from "@medusajs/icons"
import { ImageField, type FolderOption } from "../common/ImageField"

// ─── Types ────────────────────────────────────────────────────────────────────

type Block =
  | { type: "banner";    img: string; alt: string; title?: string; subtitle?: string }
  | { type: "titre";     level: 1 | 2 | 3; text: string }
  | { type: "texte";     content: string; dropcap?: boolean }
  | { type: "img";       src: string; alt: string; caption?: string; fullWidth?: boolean }
  | { type: "doubleimg"; images: [{ src: string; alt: string; caption?: string }, { src: string; alt: string; caption?: string }] }
  | { type: "tableau";   headers: string[]; rows: string[][]; caption?: string; firstColHeader?: boolean }

type BlockBuilderProps = {
  value: Block[]
  onChange: (blocks: Block[]) => void
  slug?: string
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const BLOCK_LABELS: Record<string, string> = {
  banner:    "Bannière",
  titre:     "Titre",
  texte:     "Texte",
  img:       "Image",
  doubleimg: "Double image",
  tableau:   "Tableau",
}

const BLOCK_ICONS: Record<string, React.ReactNode> = {
  banner:    <Photo className="w-4 h-4" />,
  titre:     <BarsThree className="w-4 h-4" />,
  texte:     <ChatBubbleLeftRight className="w-4 h-4" />,
  img:       <DocumentText className="w-4 h-4" />,
  doubleimg: <SquaresPlus className="w-4 h-4" />,
  tableau:   <GridList className="w-4 h-4" />,
}

function defaultBlock(type: string): Block {
  switch (type) {
    case "banner":    return { type: "banner",    img: "", alt: "", title: "", subtitle: "" }
    case "titre":     return { type: "titre",     level: 2, text: "" }
    case "texte":     return { type: "texte",     content: "", dropcap: false }
    case "img":       return { type: "img",       src: "", alt: "", caption: "", fullWidth: false }
    case "doubleimg": return { type: "doubleimg", images: [{ src: "", alt: "", caption: "" }, { src: "", alt: "", caption: "" }] }
    case "tableau":   return { type: "tableau",   headers: ["", ""], rows: [["", ""], ["", ""]], caption: "", firstColHeader: false }
    default:          return { type: "texte",     content: "" }
  }
}

// ─── Sous-éditeurs par type ───────────────────────────────────────────────────

function BannerEditor({ block, onChange, folders }: { block: Extract<Block, { type: "banner" }>; onChange: (b: Block) => void; folders: FolderOption[] }) {
  return (
    <div className="grid grid-cols-2 gap-3">
      <div className="col-span-2">
        <ImageField
          value={block.img}
          onChange={(v) => onChange({ ...block, img: v })}
          label="Image *"
          folders={folders}
          defaultFolder={folders[0]?.value}
        />
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

function ImgEditor({ block, onChange, folders }: { block: Extract<Block, { type: "img" }>; onChange: (b: Block) => void; folders: FolderOption[] }) {
  return (
    <div className="grid grid-cols-2 gap-3">
      <div className="col-span-2">
        <ImageField
          value={block.src}
          onChange={(v) => onChange({ ...block, src: v })}
          label="Image *"
          folders={folders}
          defaultFolder={folders[0]?.value}
        />
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

function DoubleImgEditor({ block, onChange, folders }: { block: Extract<Block, { type: "doubleimg" }>; onChange: (b: Block) => void; folders: FolderOption[] }) {
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
            <ImageField
              value={block.images[idx as 0|1].src}
              onChange={(v) => update(idx as 0|1, "src", v)}
              label="Image *"
              folders={folders}
              defaultFolder={folders[0]?.value}
            />
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

function TableEditor({ block, onChange }: { block: Extract<Block, { type: "tableau" }>; onChange: (b: Block) => void }) {
  // Les en-têtes font foi pour le nombre de colonnes : toutes les opérations
  // ci-dessous gardent les lignes alignées dessus.
  const headers = block.headers ?? []
  const rows    = block.rows ?? []
  const cols    = Math.max(headers.length, 1)

  const setHeader = (c: number, val: string) => {
    const next = [...headers]
    next[c] = val
    onChange({ ...block, headers: next })
  }

  const setCell = (r: number, c: number, val: string) => {
    const next = rows.map(row => [...row])
    next[r][c] = val
    onChange({ ...block, rows: next })
  }

  const addCol = () => onChange({
    ...block,
    headers: [...headers, ""],
    rows:    rows.map(row => [...row, ""]),
  })

  const removeCol = (c: number) => {
    if (cols <= 1) return
    onChange({
      ...block,
      headers: headers.filter((_, i) => i !== c),
      rows:    rows.map(row => row.filter((_, i) => i !== c)),
    })
  }

  const addRow    = () => onChange({ ...block, rows: [...rows, Array(cols).fill("")] })
  const removeRow = (r: number) => onChange({ ...block, rows: rows.filter((_, i) => i !== r) })

  return (
    <div className="space-y-3">
      <div className="overflow-x-auto">
        <table className="border-separate border-spacing-1">
          <tbody>

            {/* Ligne d'en-tête */}
            <tr>
              {Array.from({ length: cols }).map((_, c) => (
                <td key={c} className="min-w-[10rem]">
                  <div className="flex items-center justify-between gap-1 mb-1">
                    <Label size="xsmall">Colonne {c + 1}</Label>
                    <Button
                      type="button"
                      variant="transparent"
                      size="small"
                      onClick={() => removeCol(c)}
                      disabled={cols <= 1}
                      title="Supprimer la colonne"
                      className="text-ui-fg-muted"
                    >
                      <XMarkMini />
                    </Button>
                  </div>
                  <Input
                    size="small"
                    value={headers[c] ?? ""}
                    onChange={e => setHeader(c, e.target.value)}
                    placeholder="En-tête"
                  />
                </td>
              ))}
              <td />
            </tr>

            {/* Lignes de données */}
            {rows.map((row, r) => (
              <tr key={r}>
                {Array.from({ length: cols }).map((_, c) => (
                  <td key={c}>
                    <Input
                      size="small"
                      value={row[c] ?? ""}
                      onChange={e => setCell(r, c, e.target.value)}
                      placeholder="—"
                    />
                  </td>
                ))}
                <td>
                  <Button
                    type="button"
                    variant="transparent"
                    size="small"
                    onClick={() => removeRow(r)}
                    title="Supprimer la ligne"
                    className="text-ui-fg-error hover:text-ui-fg-error"
                  >
                    <Trash />
                  </Button>
                </td>
              </tr>
            ))}

          </tbody>
        </table>
      </div>

      <div className="flex gap-2">
        <Button type="button" variant="secondary" size="small" onClick={addRow}>
          <PlusMini className="mr-1" />Ligne
        </Button>
        <Button type="button" variant="secondary" size="small" onClick={addCol}>
          <PlusMini className="mr-1" />Colonne
        </Button>
      </div>

      <Text size="xsmall" className="text-ui-fg-muted">
        HTML accepté dans les cellules. En-têtes tous vides : le tableau est
        affiché sans ligne d'en-tête.
      </Text>

      <div>
        <Label size="xsmall">Légende (optionnel)</Label>
        <Input
          size="small"
          value={block.caption ?? ""}
          onChange={e => onChange({ ...block, caption: e.target.value })}
          placeholder="Légende sous le tableau"
        />
      </div>

      <label className="flex items-center gap-2 cursor-pointer">
        <input
          type="checkbox"
          checked={block.firstColHeader ?? false}
          onChange={e => onChange({ ...block, firstColHeader: e.target.checked })}
          className="rounded"
        />
        <Text size="small" className="text-ui-fg-subtle">
          Première colonne en en-tête (tableau de caractéristiques)
        </Text>
      </label>
    </div>
  )
}

function BlockEditor({ block, onChange, folders }: { block: Block; onChange: (b: Block) => void; folders: FolderOption[] }) {
  switch (block.type) {
    case "banner":    return <BannerEditor    block={block} onChange={onChange} folders={folders} />
    case "titre":     return <TitleEditor     block={block} onChange={onChange} />
    case "texte":     return <TextEditor      block={block} onChange={onChange} />
    case "img":       return <ImgEditor       block={block} onChange={onChange} folders={folders} />
    case "doubleimg": return <DoubleImgEditor block={block} onChange={onChange} folders={folders} />
    case "tableau":   return <TableEditor     block={block} onChange={onChange} />
  }
}

// ─── BlockBuilder principal ───────────────────────────────────────────────────

export default function BlockBuilder({ value, onChange, slug }: BlockBuilderProps) {
  const [collapsed, setCollapsed] = useState<Record<number, boolean>>({})
  // Dossier R2 des images du blog : Blog/<slug> (ou Blog si le slug est vide).
  const folders: FolderOption[] = [
    { value: slug ? `Blog/${slug}` : "Blog", label: slug || "Blog" },
  ]

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
              {block.type === "tableau" && (
                <Text size="xsmall" className="text-ui-fg-muted truncate max-w-xs">
                  {(block.headers?.length ?? 0)} col. × {(block.rows?.length ?? 0)} lignes
                </Text>
              )}
            </div>

            {/* Contrôles */}
            <div className="flex items-center gap-1" onClick={e => e.stopPropagation()}>
              <Button
                type="button"
                variant="transparent"
                size="small"
                onClick={() => moveBlock(i, -1)}
                disabled={i === 0}
                title="Monter"
              >
                <ArrowUpMini />
              </Button>
              <Button
                type="button"
                variant="transparent"
                size="small"
                onClick={() => moveBlock(i, 1)}
                disabled={i === value.length - 1}
                title="Descendre"
              >
                <ArrowDownMini />
              </Button>
              <Button
                type="button"
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
              <BlockEditor block={block} onChange={b => updateBlock(i, b)} folders={folders} />
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
            type="button"
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
