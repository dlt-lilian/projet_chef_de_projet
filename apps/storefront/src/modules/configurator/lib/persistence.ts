import type { ConfiguratorProductConfig } from "../config/configurableProducts"

/**
 * Persistance des choix du configurateur 3D via le `metadata` des lignes de
 * panier / commande.
 *
 * Source de vérité = la ligne de panier : chaque ligne porte SA configuration
 * (bois, couleur, motif, gravure). On peut donc rouvrir n'importe quel article
 * du panier avec exactement sa config (paramètre d'URL `?line=<lineId>` → la
 * fiche produit relit le metadata de cette ligne). Medusa recopie ce metadata
 * vers la commande, d'où l'affichage identique panier → commande → admin.
 *
 * Fichier volontairement « pur » (pas de React, `import type` pour la config)
 * afin d'être importable côté serveur (action panier, page produit) comme côté
 * client (configurateur, affichage panier), sans embarquer three.js ni les
 * données de configuration dans les bundles concernés.
 */

/** État sérialisable du configurateur : choix par option + texte de gravure. */
export type ConfiguratorState = {
  selections: Record<string, string>
  engraving: string
}

/** Config initiale injectée au montage du configurateur (depuis une ligne). */
export type InitialConfiguration = {
  selections?: Record<string, string>
  engraving?: string
}

/** Clés écrites dans le `metadata` de la ligne de panier (namespacées). */
export const CONFIGURATOR_META = {
  handle: "configurator_handle",
  selections: "configurator_selections",
  engraving: "configurator_engraving",
  options: "configurator_options",
  summary: "configurator_summary",
} as const

/** Une option configurée, prête à l'affichage (libellé + valeur lisibles). */
export type ConfiguratorLineOption = { label: string; value: string }

/**
 * Construit le `metadata` de ligne de panier à partir de l'état du configurateur.
 *
 * Déterministe : mêmes config + mêmes choix ⇒ objet identique. Medusa compare ce
 * metadata (`deepEqualObj`) pour décider de fusionner deux lignes du même variant
 * (config identique → +1 quantité) ou de les séparer (configs différentes).
 */
export function buildConfiguratorMetadata(
  config: ConfiguratorProductConfig,
  state: ConfiguratorState,
  handle: string
): Record<string, unknown> {
  const selections: Record<string, string> = {}
  const options: ConfiguratorLineOption[] = []

  for (const option of config.options) {
    if (option.type === "engraving") continue
    const choiceId = state.selections[option.id]
    if (!choiceId) continue
    const choice = option.choices.find((c) => c.id === choiceId)
    if (!choice) continue
    selections[option.id] = choiceId
    options.push({ label: option.label, value: choice.label })
  }

  const engraving = state.engraving.trim()
  const engravingOption = config.options.find((o) => o.type === "engraving")
  if (engraving && engravingOption) {
    options.push({ label: engravingOption.label, value: engraving })
  }

  const summary = options.map((o) => `${o.label}: ${o.value}`).join(" · ")

  const metadata: Record<string, unknown> = {
    [CONFIGURATOR_META.handle]: handle,
    [CONFIGURATOR_META.selections]: selections,
    [CONFIGURATOR_META.options]: options,
    [CONFIGURATOR_META.summary]: summary,
  }
  if (engraving) metadata[CONFIGURATOR_META.engraving] = engraving
  return metadata
}

/**
 * Lit les options configurées d'une ligne pour l'affichage (panier / commande).
 * Renvoie `null` si la ligne n'a pas été personnalisée via le configurateur 3D.
 */
export function readConfiguratorLineOptions(
  metadata: Record<string, unknown> | null | undefined
): ConfiguratorLineOption[] | null {
  if (!metadata) return null
  const raw = metadata[CONFIGURATOR_META.options]
  if (!Array.isArray(raw)) return null

  const options = raw.filter(
    (o): o is ConfiguratorLineOption =>
      !!o &&
      typeof o === "object" &&
      typeof (o as { label?: unknown }).label === "string" &&
      typeof (o as { value?: unknown }).value === "string"
  )
  return options.length ? options : null
}

/**
 * Extrait les choix bruts (id d'option → id de choix) + gravure du metadata
 * d'une ligne, pour ré-initialiser le configurateur quand on rouvre cet article
 * depuis le panier (`?line=<id>`). Renvoie `null` si la ligne n'est pas
 * configurée.
 */
export function readConfiguratorSelections(
  metadata: Record<string, unknown> | null | undefined
): { selections: Record<string, string>; engraving: string } | null {
  if (!metadata) return null

  const rawSelections = metadata[CONFIGURATOR_META.selections]
  const selections: Record<string, string> = {}
  if (
    rawSelections &&
    typeof rawSelections === "object" &&
    !Array.isArray(rawSelections)
  ) {
    for (const [optionId, choiceId] of Object.entries(rawSelections)) {
      if (typeof choiceId === "string") selections[optionId] = choiceId
    }
  }

  const rawEngraving = metadata[CONFIGURATOR_META.engraving]
  const engraving = typeof rawEngraving === "string" ? rawEngraving : ""

  if (Object.keys(selections).length === 0 && !engraving) return null
  return { selections, engraving }
}
