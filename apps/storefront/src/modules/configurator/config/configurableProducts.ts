export type ConfigurableHandle = "baguettes" | "eventail" | "parapluie"

export type ConfiguratorOptionType = "texture" | "motif" | "color" | "engraving"

export type ConfiguratorChoice = {
  id: string
  label: string
  texturePath?: string
  /** Couleur unie (hex) — utilisée par les options de type "color". */
  colorHex?: string
}

type BaseOption = {
  id: string
  label: string
  /**
   * Nom du mesh (ou du matériau) à l'intérieur du GLB ciblé par cette option.
   * Peut être une liste de noms pour cibler plusieurs meshes d'un coup
   * (ex. les 2 vis de l'éventail). Requis pour `texture`/`motif`/`color`.
   */
  targetMesh?: string | string[]
}

export type ConfiguratorTextureOption = BaseOption & {
  type: "texture" | "motif"
  targetMesh: string | string[]
  choices: ConfiguratorChoice[]
}

export type ConfiguratorColorOption = BaseOption & {
  type: "color"
  targetMesh: string | string[]
  choices: ConfiguratorChoice[]
}

export type ConfiguratorEngravingOption = BaseOption & {
  type: "engraving"
}

export type ConfiguratorOption =
  | ConfiguratorTextureOption
  | ConfiguratorColorOption
  | ConfiguratorEngravingOption

export type ConfiguratorProductConfig = {
  glbPath: string
  options: ConfiguratorOption[]
  /** Auto-rotation du modèle dans le viewer (défaut : true). */
  autoRotate?: boolean
  /** Orientation initiale du modèle en degrés [x, y, z] (défaut : [0, 0, 90]). */
  modelRotationDeg?: [number, number, number]
}

export type ProductConfigMap = Record<
  ConfigurableHandle,
  ConfiguratorProductConfig
>

export const CONFIGURABLE_HANDLES: ConfigurableHandle[] = [
  "baguettes",
  "eventail",
  "parapluie",
]

/** Palette de couleurs unies Kogei (laque / bois teinté), partagée par les produits. */
export const COLOR_CHOICES: ConfiguratorChoice[] = [
  { id: "naturel", label: "Naturel", colorHex: "#C4A882" },
  { id: "noir", label: "Noir Laqué", colorHex: "#1A1A1A" },
  { id: "vermillon", label: "Vermillon", colorHex: "#C0392B" },
  { id: "or", label: "Or", colorHex: "#D4AF37" },
  { id: "nacre", label: "Blanc Nacré", colorHex: "#F5F0E8" },
  { id: "indigo", label: "Bleu Indigo", colorHex: "#1B3A6B" },
]

export const PRODUCT_CONFIG: ProductConfigMap = {
  baguettes: {
    glbPath: "/3d/baguettes/baguettes.glb",
    options: [
      {
        id: "color",
        label: "Couleur",
        type: "color",
        targetMesh: "Material_0",
        choices: COLOR_CHOICES,
      },
      {
        id: "wood",
        label: "Essence de bois",
        type: "texture",
        targetMesh: "Material_0",
        choices: [
          {
            id: "blue",
            label: "Bleu",
            texturePath: "/3d/baguettes/textures/Wood_Color_white_and_blue.jpg",
          },
          {
            id: "pink",
            label: "rose",
            texturePath: "/3d/baguettes/textures/metal_pink.jpg",
          },
          {
            id: "pastelpink",
            label: "rose pastel",
            texturePath: "/3d/baguettes/textures/pastel_pink_japanese_style_wave_pattern_background_1611.jpg",
          },
        ],
      },
      {
        id: "engraving",
        label: "Gravure",
        type: "engraving",
      },
    ],
  },
  eventail: {
    // GLB multi-mesh : nodes `Bois`, `Papier`, `vis_1`, `vis_2`.
    // Chaque option cible son node par son nom → modification indépendante.
    glbPath: "/3d/eventail/eventail.glb",
    // Éventail figé et redressé : la normale du modèle est sur X ; une rotation
    // de 90° autour de Y l'amène face caméra et debout (la rotation z=90° par
    // défaut la mettait vers le haut → éventail à plat). Auto-rotation coupée.
    autoRotate: false,
    modelRotationDeg: [0, 90, 0],
    options: [
      // ── BOIS (monture) — texture bois seule ────────────────────────────
      {
        id: "bois",
        label: "Bois (monture)",
        type: "texture",
        targetMesh: "Bois",
        choices: [
          // TODO assets : déposer les vraies textures dans
          // /3d/eventail/textures/. Placeholders = images baguettes existantes.
          {
            id: "bois-clair",
            label: "Bois clair",
            texturePath:
              "/3d/baguettes/textures/Wood_Color_white_and_blue.jpg",
          },
          {
            id: "bois-rose",
            label: "Bois rosé",
            texturePath: "/3d/baguettes/textures/metal_pink.jpg",
          },
          {
            id: "bois-motif",
            label: "Bois à motif",
            texturePath:
              "/3d/baguettes/textures/pastel_pink_japanese_style_wave_pattern_background_1611.jpg",
          },
        ],
      },
      // ── PAPIER (toile) — couleur + tissu + motif ───────────────────────
      {
        id: "papier-color",
        label: "Couleur du papier",
        type: "color",
        targetMesh: "Papier",
        choices: COLOR_CHOICES,
      },
      {
        id: "papier-motif",
        label: "Motif du papier",
        type: "motif",
        targetMesh: "Papier",
        choices: [
          // « Aucun » (sans texturePath) = retire l'overlay motif.
          { id: "none", label: "Aucun" },
          {
            id: "motif-1",
            label: "Motif 1",
            texturePath: "/3d/eventail/textures/motif_1.jpg",
          },
          // TODO assets : déposer des PNG TRANSPARENTS dans
          // /3d/eventail/textures/ (sinon le motif couvre toute la base).
          {
            id: "sakura",
            label: "Sakura",
            texturePath: "/3d/eventail/textures/motif-sakura.png",
          },
          {
            id: "wave",
            label: "Vague",
            texturePath: "/3d/eventail/textures/motif-wave.png",
          },
        ],
      },
      // ── VIS — couleur, les 2 vis ensemble ──────────────────────────────
      {
        id: "vis",
        label: "Vis (finition)",
        type: "color",
        targetMesh: ["vis_1", "vis_2"],
        choices: [
          { id: "or", label: "Or", colorHex: "#D4AF37" },
          { id: "argent", label: "Argent", colorHex: "#C0C0C0" },
          { id: "bronze", label: "Bronze", colorHex: "#8C6A3F" },
          { id: "noir", label: "Noir", colorHex: "#1A1A1A" },
        ],
      },
      {
        id: "engraving",
        label: "Gravure",
        type: "engraving",
      },
    ],
  },
  parapluie: {
    glbPath: "/3d/parapluie/parapluie.glb",
    options: [
      {
        id: "color",
        label: "Couleur",
        type: "color",
        targetMesh: "Material_0",
        choices: COLOR_CHOICES,
      },
      {
        id: "canopy",
        label: "Toile",
        type: "texture",
        targetMesh: "Material_0",
        choices: [
          {
            id: "indigo",
            label: "Indigo",
            texturePath: "/3d/parapluie/textures/indigo.jpg",
          },
          {
            id: "kraft",
            label: "Kraft",
            texturePath: "/3d/parapluie/textures/kraft.jpg",
          },
          {
            id: "black",
            label: "Noir",
            texturePath: "/3d/parapluie/textures/black.jpg",
          },
        ],
      },
      {
        id: "engraving",
        label: "Gravure du manche",
        type: "engraving",
      },
    ],
  },
}

export function isConfigurableProduct(
  handle: string | null | undefined
): handle is ConfigurableHandle {
  if (!handle) return false
  return (CONFIGURABLE_HANDLES as string[]).includes(handle)
}

export function getProductConfig(
  handle: ConfigurableHandle
): ConfiguratorProductConfig {
  return PRODUCT_CONFIG[handle]
}
