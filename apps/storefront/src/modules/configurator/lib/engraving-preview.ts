/**
 * Réglages de l'aperçu 3D de la gravure — PROTOTYPE (baguettes uniquement).
 *
 * Module séparé de `engraving.ts` : ConfiguratorLayout le lit dans le bundle
 * statique de la fiche, alors que `engraving.ts` importe three.js, réservé au
 * chunk différé du viewer.
 *
 * Seuls des ratios sont saisis ici : la position réelle est calculée à partir
 * de la géométrie (cf. `buildEngraving`).
 */
export type EngravingPreviewConfig = {
  /** Meshes gravés ; absent = tous les meshes du modèle. */
  targetMesh?: string | string[]
  /** Marge entre le bout du manche et le début du texte (ratio de la longueur). */
  marginRatio: number
  /** Longueur maximale du texte (ratio de la longueur du mesh). */
  maxLengthRatio: number
  /** Hauteur des lettres, en ratio du diamètre au point le plus fin du texte. */
  heightRatio: number
}

/**
 * Produits dotés de l'aperçu, par handle. Constante front le temps du
 * prototype : si le rendu est validé, ces réglages rejoindront l'option
 * « engraving » de la section Configurateur de l'admin.
 */
export const ENGRAVING_PREVIEW: Record<string, EngravingPreviewConfig> = {
  baguettes: {
    marginRatio: 0.05,
    maxLengthRatio: 0.42,
    // 0.5 donnait des lettres d'environ 13 px en vue initiale. Au-delà de
    // ~0.75, les bords du texte tombent sur la partie fuyante de la courbe et
    // s'étirent.
    heightRatio: 0.72,
  },
}
