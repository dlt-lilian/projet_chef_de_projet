export type ConfigurableHandle = "chopsticks" | "eventail" | "parapluie"

export type ConfiguratorOptionType = "texture" | "motif" | "engraving"

export type ConfiguratorChoice = {
  id: string
  label: string
  texturePath?: string
}

type BaseOption = {
  id: string
  label: string
  /**
   * Name of the mesh (or material) inside the GLB this option targets.
   * Required for `texture` and `motif` so the viewer knows which mesh to repaint.
   */
  targetMesh?: string
}

export type ConfiguratorTextureOption = BaseOption & {
  type: "texture" | "motif"
  targetMesh: string
  choices: ConfiguratorChoice[]
}

export type ConfiguratorEngravingOption = BaseOption & {
  type: "engraving"
}

export type ConfiguratorOption =
  | ConfiguratorTextureOption
  | ConfiguratorEngravingOption

export type ConfiguratorProductConfig = {
  glbPath: string
  options: ConfiguratorOption[]
}

export type ProductConfigMap = Record<
  ConfigurableHandle,
  ConfiguratorProductConfig
>

export const CONFIGURABLE_HANDLES: ConfigurableHandle[] = [
  "chopsticks",
  "eventail",
  "parapluie",
]

export const PRODUCT_CONFIG: ProductConfigMap = {
  chopsticks: {
    glbPath: "/3d/chopsticks/chopsticks.glb",
    options: [
      {
        id: "wood",
        label: "Essence de bois",
        type: "texture",
        targetMesh: "Material_0",
        choices: [
          {
            id: "blue",
            label: "Bleu",
            texturePath: "/3d/chopsticks/textures/Wood_Color_white_and_blue.jpg",
          },
          {
            id: "pink",
            label: "rose",
            texturePath: "/3d/chopsticks/textures/metal_pink.jpg",
          },
          {
            id: "pastelpink",
            label: "rose pastel",
            texturePath: "/3d/chopsticks/textures/pastel_pink_japanese_style_wave_pattern_background_1611.jpg",
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
    glbPath: "/3d/eventail/eventail.glb",
    options: [
      {
        id: "fabric",
        label: "Tissu",
        type: "texture",
        targetMesh: "Material_0",
        choices: [
          {
            id: "silk-red",
            label: "Soie rouge",
            texturePath: "/3d/eventail/textures/silk-red.jpg",
          },
          {
            id: "silk-blue",
            label: "Soie bleue",
            texturePath: "/3d/eventail/textures/silk-blue.jpg",
          },
          {
            id: "silk-cream",
            label: "Soie crème",
            texturePath: "/3d/eventail/textures/silk-cream.jpg",
          },
        ],
      },
      {
        id: "motif",
        label: "Motif",
        type: "motif",
        targetMesh: "Material_0",
        choices: [
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
