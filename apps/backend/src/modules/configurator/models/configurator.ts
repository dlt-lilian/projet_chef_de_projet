import { model } from "@medusajs/framework/utils"

/**
 * Configuration du configurateur 3D, éditable depuis l'admin.
 *
 * Hiérarchie : Product (1) ─< Option (N) ─< Choice (N)
 *  - Product : un produit configurable (lié au handle Medusa) + son GLB.
 *  - Option  : un axe de personnalisation (couleur du papier, vis, bois…),
 *              ciblant un mesh du GLB.
 *  - Choice  : une valeur possible (couleur unie, texture bois, motif…).
 *
 * Les 3 modèles sont dans un seul fichier pour éviter les imports circulaires
 * entre relations (product ↔ option ↔ choice).
 */

export const ConfiguratorProduct = model.define("configurator_product", {
  id: model.id({ prefix: "cfgprod" }).primaryKey(),
  // Handle du produit Medusa correspondant (ex. "eventail") — clé de liaison.
  handle: model.text().unique(),
  // Chemin du modèle 3D servi par le storefront (ex. "/3d/eventail/eventail.glb").
  glb_path: model.text(),
  auto_rotate: model.boolean().default(true),
  // Orientation initiale [x, y, z] en degrés. null → défaut storefront [0,0,90].
  model_rotation_deg: model.json().nullable(),
  options: model.hasMany(() => ConfiguratorOption, { mappedBy: "product" }),
})

export const ConfiguratorOption = model.define("configurator_option", {
  id: model.id({ prefix: "cfgopt" }).primaryKey(),
  // Identifiant stable utilisé par le storefront (ex. "papier-color").
  option_key: model.text(),
  label: model.text(),
  type: model.enum(["color", "texture", "motif", "engraving"]),
  // Mesh(es) du GLB ciblé(s) : "Papier" ou ["vis_1","vis_2"]. null pour engraving.
  target_mesh: model.json().nullable(),
  rank: model.number().default(0),
  product: model.belongsTo(() => ConfiguratorProduct, { mappedBy: "options" }),
  choices: model.hasMany(() => ConfiguratorChoice, { mappedBy: "option" }),
})

export const ConfiguratorChoice = model.define("configurator_choice", {
  id: model.id({ prefix: "cfgchoice" }).primaryKey(),
  // Identifiant stable utilisé par le storefront (ex. "naturel").
  choice_key: model.text(),
  label: model.text(),
  // Couleur unie (options "color"/"vis").
  color_hex: model.text().nullable(),
  // Texture/motif (options "texture"/"motif") : URL ou chemin storefront.
  texture_path: model.text().nullable(),
  // Assombrissement du bois (0 = naturel, 1 = noir) pour les teintes de bois.
  darken: model.float().nullable(),
  rank: model.number().default(0),
  // Choix sélectionné par défaut à l'ouverture du configurateur.
  is_default: model.boolean().default(false),
  option: model.belongsTo(() => ConfiguratorOption, { mappedBy: "choices" }),
})
