/**
 * Seed : importe la configuration 3D actuellement codée en dur côté storefront
 * (apps/storefront/src/modules/configurator/config/configurableProducts.ts)
 * dans les tables configurator_*.
 *
 * Usage (depuis apps/backend) :
 *   npx medusa exec src/scripts/seed-configurator.ts
 *
 * Idempotent : un produit dont le handle existe déjà est ignoré.
 */

import { CONFIGURATOR_MODULE } from "../modules/configurator"
import type ConfiguratorModuleService from "../modules/configurator/service"
import type { ExecArgs } from "@medusajs/framework/types"

// ── Palettes partagées (copie de configurableProducts.ts) ────────────────────
const COLOR_CHOICES = [
  { id: "naturel", label: "Naturel", colorHex: "#C4A882" },
  { id: "noir", label: "Noir Laqué", colorHex: "#1A1A1A" },
  { id: "vermillon", label: "Vermillon", colorHex: "#C0392B" },
  { id: "or", label: "Or", colorHex: "#D4AF37" },
  { id: "nacre", label: "Blanc Nacré", colorHex: "#F5F0E8" },
  { id: "indigo", label: "Bleu Indigo", colorHex: "#1B3A6B" },
]

const WOOD_TEXTURE = "/3d/textures/bois_1.jpg"
const WOOD_CHOICES = [
  { id: "naturel", label: "Naturel", texturePath: WOOD_TEXTURE, darken: 0 },
  { id: "miel", label: "Miel", texturePath: WOOD_TEXTURE, darken: 0.18 },
  { id: "chataigne", label: "Châtaigne", texturePath: WOOD_TEXTURE, darken: 0.35 },
  { id: "noyer", label: "Noyer", texturePath: WOOD_TEXTURE, darken: 0.55 },
  { id: "ebene", label: "Ébène", texturePath: WOOD_TEXTURE, darken: 0.72 },
]

type SeedChoice = {
  id: string
  label: string
  colorHex?: string
  texturePath?: string
  darken?: number
}
type SeedOption = {
  id: string
  label: string
  type: "color" | "texture" | "motif" | "engraving"
  targetMesh?: string | string[]
  choices?: SeedChoice[]
}
type SeedProduct = {
  handle: string
  glbPath: string
  autoRotate?: boolean
  modelRotationDeg?: [number, number, number]
  options: SeedOption[]
}

const PRODUCTS: SeedProduct[] = [
  {
    handle: "baguettes",
    glbPath: "/3d/baguettes/baguettes.glb",
    options: [
      { id: "color", label: "Couleur du bois", type: "color", targetMesh: "Material_0", choices: COLOR_CHOICES },
      { id: "wood", label: "Teinte du bois", type: "texture", targetMesh: "Material_0", choices: WOOD_CHOICES },
      { id: "engraving", label: "Gravure", type: "engraving" },
    ],
  },
  {
    handle: "eventail",
    glbPath: "/3d/eventail/eventail.glb",
    autoRotate: false,
    modelRotationDeg: [0, 90, 0],
    options: [
      { id: "bois", label: "Bois (monture)", type: "texture", targetMesh: "Bois", choices: WOOD_CHOICES },
      { id: "papier-color", label: "Couleur du papier", type: "color", targetMesh: "Papier", choices: COLOR_CHOICES },
      {
        id: "papier-motif",
        label: "Motif du papier",
        type: "motif",
        targetMesh: "Papier",
        choices: [
          { id: "none", label: "Aucun" },
          { id: "motif-1", label: "Motif 1", texturePath: "/3d/eventail/textures/motif_1.jpg" },
          { id: "rose", label: "rose", texturePath: "/3d/eventail/textures/motif_rose.svg" },
          { id: "wave", label: "Vague", texturePath: "/3d/eventail/textures/motif-wave.png" },
        ],
      },
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
      { id: "engraving", label: "Gravure", type: "engraving" },
    ],
  },
  {
    handle: "parapluie",
    glbPath: "/3d/parapluie/parapluie.glb",
    options: [
      { id: "color", label: "Couleur", type: "color", targetMesh: "Material_0", choices: COLOR_CHOICES },
      {
        id: "canopy",
        label: "Toile",
        type: "texture",
        targetMesh: "Material_0",
        choices: [
          { id: "indigo", label: "Indigo", texturePath: "/3d/parapluie/textures/indigo.jpg" },
          { id: "kraft", label: "Kraft", texturePath: "/3d/parapluie/textures/kraft.jpg" },
          { id: "black", label: "Noir", texturePath: "/3d/parapluie/textures/black.jpg" },
        ],
      },
      { id: "engraving", label: "Gravure du manche", type: "engraving" },
    ],
  },
]

export default async function seedConfigurator({ container }: ExecArgs) {
  const svc: ConfiguratorModuleService = container.resolve(CONFIGURATOR_MODULE)

  console.log(`\n🎨 Seed configurateur — ${PRODUCTS.length} produit(s)...\n`)
  let created = 0
  let skipped = 0

  for (const p of PRODUCTS) {
    const existing = await svc.listConfiguratorProducts({ handle: p.handle })
    if (existing.length > 0) {
      console.log(`  ⏭  Ignoré   ${p.handle} (déjà en base)`)
      skipped++
      continue
    }

    const product = await svc.createConfiguratorProducts({
      handle: p.handle,
      glb_path: p.glbPath,
      auto_rotate: p.autoRotate ?? true,
      // json() est typé Record<…> par Medusa DML, mais on y stocke un [x, y, z].
      model_rotation_deg: (p.modelRotationDeg ?? null) as unknown as
        | Record<string, unknown>
        | null,
    })

    for (let oi = 0; oi < p.options.length; oi++) {
      const o = p.options[oi]
      const option = await svc.createConfiguratorOptions({
        option_key: o.id,
        label: o.label,
        type: o.type,
        // json() est typé Record<…> par Medusa DML, mais target_mesh est string|string[].
        target_mesh: (o.targetMesh ?? null) as unknown as
          | Record<string, unknown>
          | null,
        rank: oi,
        product_id: product.id,
      })

      const choices = o.choices ?? []
      for (let ci = 0; ci < choices.length; ci++) {
        const c = choices[ci]
        await svc.createConfiguratorChoices({
          choice_key: c.id,
          label: c.label,
          color_hex: c.colorHex ?? null,
          texture_path: c.texturePath ?? null,
          darken: c.darken ?? null,
          rank: ci,
          is_default: ci === 0, // 1er choix = défaut (comportement storefront actuel)
          option_id: option.id,
        })
      }
    }

    console.log(`  ✅ Créé     ${p.handle} (${p.options.length} options)`)
    created++
  }

  console.log(`\n✨ Seed terminé — ${created} créé(s), ${skipped} ignoré(s).\n`)
}
