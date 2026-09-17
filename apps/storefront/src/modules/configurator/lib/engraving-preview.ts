/**
 * Réglages de l'aperçu 3D de la gravure — PROTOTYPE (baguettes, éventail).
 *
 * Module séparé de `engraving.ts` : ConfiguratorLayout le lit dans le bundle
 * statique de la fiche, alors que `engraving.ts` importe three.js, réservé au
 * chunk différé du viewer.
 *
 * Seuls des ratios sont saisis ici : la position réelle est calculée à partir
 * de la géométrie (cf. `buildEngraving`).
 */

type BasePlacement = {
  /** Meshes gravés ; absent = tous les meshes du modèle. */
  targetMesh?: string | string[]
  /** Longueur maximale du texte (ratio, cf. chaque placement). */
  maxLengthRatio: number
}

/**
 * Pièce allongée et conique (baguette) : texte le long de l'axe, en partant du
 * bout épais (le manche).
 */
export type ElongatedPlacement = BasePlacement & {
  placement: "elongated"
  /** Marge entre le bout du manche et le début du texte (ratio de la longueur). */
  marginRatio: number
  /** Hauteur des lettres, en ratio du diamètre au point le plus fin du texte. */
  heightRatio: number
}

/**
 * Surface à peu près plane (papier d'éventail) : texte horizontal à la vue
 * initiale, centré sur un point de la surface.
 *
 * Les ratios portent sur l'emprise du mesh dans son plan, vue de face :
 * largeur (gauche → droite) et hauteur (bas → haut).
 */
export type PlanarPlacement = BasePlacement & {
  placement: "planar"
  /** Centre du texte : [0 = bord gauche … 1 = bord droit, 0 = bas … 1 = haut]. */
  anchor: [number, number]
  /** Hauteur des lettres, en ratio de la hauteur du mesh. */
  heightRatio: number
}

/**
 * Une branche d'une monture en éventail (un seul mesh, une île de géométrie
 * par branche) : texte le long de la branche choisie, en partant du pivot.
 *
 * La longueur se mesure depuis le pivot : `startRatio` 0 = pivot, 1 = bout de
 * la branche ; `maxLengthRatio` est aussi une fraction de cette longueur.
 */
export type RibPlacement = BasePlacement & {
  placement: "rib"
  /**
   * Branche retenue : celle dont l'angle à l'écran, vue initiale, est le plus
   * proche (0° = vers la droite, 90° = vers le haut).
   */
  angleDeg: number
  /** Début du texte le long de la branche (ratio depuis le pivot). */
  startRatio: number
  /** Hauteur des lettres, en ratio de la largeur de la branche. */
  heightRatio: number
}

export type EngravingPreviewConfig =
  | ElongatedPlacement
  | PlanarPlacement
  | RibPlacement

/**
 * Produits dotés de l'aperçu, par handle. Constante front le temps du
 * prototype : si le rendu est validé, ces réglages rejoindront l'option
 * « engraving » de la section Configurateur de l'admin.
 */
export const ENGRAVING_PREVIEW: Record<string, EngravingPreviewConfig> = {
  baguettes: {
    placement: "elongated",
    marginRatio: 0.05,
    maxLengthRatio: 0.42,
    // 0.5 donnait des lettres d'environ 13 px en vue initiale. Au-delà de
    // ~0.75, les bords du texte tombent sur la partie fuyante de la courbe et
    // s'étirent.
    heightRatio: 0.72,
  },
  eventail: {
    placement: "rib",
    // Gravure sur le bois : la branche la plus à droite à la vue initiale
    // (la plus proche de 0°, l'horizontale vers la droite).
    targetMesh: "Bois",
    angleDeg: 0,
    // Les branches convergent et se chevauchent près du pivot, et le papier
    // les recouvre au-delà de ~97 % : le texte reste entre 36 % et 86 %.
    startRatio: 0.36,
    maxLengthRatio: 0.5,
    heightRatio: 0.7,
  },
}
