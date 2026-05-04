// ─────────────────────────────────────────────────
// Types partagés pour le viewer 3D et le customizer
// ─────────────────────────────────────────────────

export type ProductHandle =
  | "baguettes-japonaises"
  | "eventail-japonais"
  | "parapluie-japonais"
  | "pack-kogei"

export type ColorOption = {
  id: string
  label: string
  hex: string
}

export type DesignOption = {
  id: string
  label: string
  /** Chemin vers le fichier texture dans /public/3d-textures/ — null = uni */
  texturePath: string | null
  /** Couleur d'aperçu dans le sélecteur */
  preview: string
}

export type CustomizationState = {
  color: ColorOption
  design: DesignOption
  engravingText: string
}

/** Props passées au composant 3D */
export type CustomizationOptions = {
  colorHex: string
  texturePath: string | null
  engravingText: string
}
