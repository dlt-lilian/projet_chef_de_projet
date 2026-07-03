import { useEffect, useRef, useState, type ChangeEvent } from "react"
import { Button, Input, Label, toast } from "@medusajs/ui"

// ─── Upload d'un fichier vers R2 (/admin/media/upload) → URL publique ──────────
// Hook partagé par tous les écrans admin qui uploadent vers R2 (configurateur,
// slider, galerie, blog…). Le `folder` est validé côté serveur (whitelist).
export function useR2Upload() {
  const [uploading, setUploading] = useState(false)
  const upload = async (file: File, folder: string): Promise<string | null> => {
    setUploading(true)
    try {
      const form = new FormData()
      form.append("files", file)
      form.append("folder", folder)
      const res = await fetch("/admin/media/upload", {
        method: "POST",
        credentials: "include",
        body: form,
      })
      if (!res.ok) {
        const body = await res.json().catch(() => null)
        throw new Error((body?.message as string) || "Échec de l'upload")
      }
      const data = await res.json()
      const url = data?.url as string | undefined
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

// ─── Un dossier R2 proposé dans le menu « Ranger dans » ────────────────────────
export type FolderOption = { value: string; label: string }

// ─── Champ image : upload vers R2 + aperçu + URL manuelle + choix du dossier ───
// Composant PARTAGÉ, paramétrable par la liste de dossiers proposés (`folders`).
// Le premier dossier de la liste est sélectionné par défaut (surchargeable via
// `defaultFolder`).
export function ImageField({
  value,
  onChange,
  label,
  folders,
  defaultFolder,
}: {
  value: string
  onChange: (v: string) => void
  label: string
  folders: FolderOption[]
  defaultFolder?: string
}) {
  const inputRef = useRef<HTMLInputElement>(null)
  const { upload, uploading } = useR2Upload()
  const [folder, setFolder] = useState(defaultFolder ?? folders[0]?.value ?? "")

  // Si le dossier par défaut change après le montage (ex. blog : le slug se
  // remplit après coup), on suit ce changement. Sans `defaultFolder` fourni
  // (slider/galerie), aucun effet → la sélection manuelle reste préservée.
  useEffect(() => {
    if (defaultFolder) setFolder(defaultFolder)
  }, [defaultFolder])

  const onFile = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const url = await upload(file, folder)
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
          placeholder="https://…"
          className="flex-1 font-mono text-xs"
        />
      </div>
      <div className="mt-1 flex items-center gap-2">
        <span className="shrink-0 text-[10px] uppercase text-ui-fg-muted">
          Ranger dans
        </span>
        <select
          value={folder}
          onChange={(e) => setFolder(e.target.value)}
          className="txt-compact-small flex-1 rounded-md border border-ui-border-base bg-ui-bg-field px-2 py-1"
        >
          {folders.map((f) => (
            <option key={f.value} value={f.value}>{f.label}</option>
          ))}
        </select>
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
