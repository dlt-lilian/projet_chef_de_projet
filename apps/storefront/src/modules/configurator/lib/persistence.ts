import type { ConfiguratorProductConfig } from "../config/configurableProducts"

/**
 * Persistance des choix du configurateur 3D.
 *
 * Deux mécanismes complémentaires :
 *  1. `localStorage` (par produit) → restaure les choix quand l'utilisateur
 *     revient sur la fiche produit (même navigateur).
 *  2. `metadata` de ligne de panier → enregistre durablement la configuration
 *     dans le panier PUIS la commande (Medusa recopie le metadata), pour
 *     l'affichage client et la préparation de commande côté admin.
 *
 * Ce fichier est volontairement « pur » (pas de React, `import type` pour la
 * config) afin de pouvoir être importé aussi bien par le configurateur que par
 * les composants d'affichage du panier / de la commande, sans embarquer three.js
 * ni les données de configuration dans leur bundle.
 */

/** État sérialisable du configurateur : choix par option + texte de gravure. */
export type ConfiguratorState = {
  selections: Record<string, string>
  engraving: string
}

/* ───────────────────────── localStorage (fiche produit) ───────────────────── */

const STORAGE_PREFIX = "hinaso:configurator:"
const ENGRAVING_MAX_LENGTH = 30

function storageKey(handle: string): string {
  return `${STORAGE_PREFIX}${handle}`
}

/**
 * Restaure l'état sauvegardé pour ce produit, validé contre la config courante :
 * tout choix/option qui n'existe plus est ignoré (config éditée en admin depuis).
 * Renvoie `null` si rien de valide n'est stocké.
 */
export function loadConfiguratorState(
  handle: string,
  config: ConfiguratorProductConfig
): Partial<ConfiguratorState> | null {
  if (typeof window === "undefined") return null

  let raw: string | null = null
  try {
    raw = window.localStorage.getItem(storageKey(handle))
  } catch {
    return null // localStorage indisponible (mode privé, quota, etc.)
  }
  if (!raw) return null

  let parsed: unknown
  try {
    parsed = JSON.parse(raw)
  } catch {
    return null
  }
  if (!parsed || typeof parsed !== "object") return null

  const saved = parsed as Partial<ConfiguratorState>
  const selections: Record<string, string> = {}

  for (const option of config.options) {
    if (option.type === "engraving") continue
    const savedChoice = saved.selections?.[option.id]
    if (savedChoice && option.choices.some((c) => c.id === savedChoice)) {
      selections[option.id] = savedChoice
    }
  }

  const engraving =
    typeof saved.engraving === "string"
      ? saved.engraving.slice(0, ENGRAVING_MAX_LENGTH)
      : ""

  if (Object.keys(selections).length === 0 && !engraving) return null
  return { selections, engraving }
}

/** Sauvegarde l'état courant du configurateur pour ce produit. */
export function saveConfiguratorState(
  handle: string,
  state: ConfiguratorState
): void {
  if (typeof window === "undefined") return
  try {
    window.localStorage.setItem(storageKey(handle), JSON.stringify(state))
  } catch {
    // Silencieux : la persistance locale est un confort, pas une fonction vitale.
  }
}

/* ───────────────────── metadata de ligne de panier / commande ──────────────── */

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
 * Lit les options configurées d'une ligne de panier / commande pour l'affichage.
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
