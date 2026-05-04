// ─────────────────────────────────────────────────────────────────
// Configuration des options de personnalisation Kogei
// Placer vos fichiers dans :
//   public/3d-models/   → baguettes.glb | eventail.glb | parapluie.glb
//   public/3d-textures/ → sakura.jpg | dragons.jpg | vagues.jpg | bambou.jpg
// ─────────────────────────────────────────────────────────────────

import type { ColorOption, DesignOption, ProductHandle } from "@modules/products/components/product-viewer-3d/types"

export const COLOR_OPTIONS: ColorOption[] = [
  { id: "naturel",  label: "Naturel",       hex: "#C4A882" },
  { id: "noir",     label: "Noir Laqué",    hex: "#1A1A1A" },
  { id: "vermillon",label: "Vermillon",      hex: "#C0392B" },
  { id: "or",       label: "Or",            hex: "#D4AF37" },
  { id: "nacre",    label: "Blanc Nacré",   hex: "#F5F0E8" },
  { id: "indigo",   label: "Bleu Indigo",   hex: "#1B3A6B" },
]

export const DESIGN_OPTIONS: DesignOption[] = [
  { id: "uni",      label: "Uni",      texturePath: null,                          preview: "#C4A882" },
  { id: "sakura",   label: "Sakura",   texturePath: "/3d-textures/Wood_Color_white_and_blue.jpg",     preview: "#FFB7C5" },
  { id: "dragons",  label: "Dragons",  texturePath: "/3d-textures/dragons.jpg",    preview: "#8B1A1A" },
  { id: "vagues",   label: "Vagues",   texturePath: "/3d-textures/vagues.jpg",     preview: "#1B6CA8" },
  { id: "bambou",   label: "Bambou",   texturePath: "/3d-textures/bambou.jpg",     preview: "#5D8A52" },
]

/** Chemins des modèles 3D par handle Medusa */
export const MODEL_PATHS: Record<string, string> = {
  "baguettes-japonaises": "/3d-models/baguettes.glb",
  "eventail-japonais":    "/3d-models/eventail.glb",
  "parapluie-japonais":   "/3d-models/parapluie.glb",
}

/** Positions des modèles dans la scène du Pack */
export const PACK_MODELS: { path: string; position: [number, number, number]; scale: number }[] = [
  { path: "/3d-models/baguettes.glb", position: [-2, 0, 0],  scale: 1 },
  { path: "/3d-models/eventail.glb",  position: [0, 0, 0],   scale: 1 },
  { path: "/3d-models/parapluie.glb", position: [2, 0, 0],   scale: 1 },
]

/** Couleur et design par défaut */
export const DEFAULT_COLOR = COLOR_OPTIONS[0]
export const DEFAULT_DESIGN = DESIGN_OPTIONS[0]
