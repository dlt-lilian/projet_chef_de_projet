/**
 * Tarification des options du configurateur 3D.
 *
 * Toutes les valeurs `price_delta` sont des SUPPLÉMENTS EN CENTIMES (entiers
 * ≥ 0). Elles ne sont converties en montant Medusa (euros décimaux, unité de
 * `unit_price`) qu'au dernier moment, par `centsToAmount`.
 *
 * Règle de sécurité : le supplément facturé est TOUJOURS recalculé ici à partir
 * de la base, jamais lu depuis la requête du client — sinon n'importe qui
 * pourrait s'ajouter un produit à 0 €.
 */

/** Choix tel que stocké (sous-ensemble utile au calcul). */
type PricedChoice = {
  choice_key: string
  label: string
  price_delta?: number | null
}

/** Option telle que stockée (sous-ensemble utile au calcul). */
type PricedOption = {
  option_key: string
  label: string
  type: string
  price_delta?: number | null
  choices?: PricedChoice[] | null
}

/** Sélections envoyées par le client : { option_key: choice_key }. */
export type ConfiguratorSelections = Record<string, string>

/** Détail d'une ligne de supplément, pour l'affichage panier / commande. */
export type SurchargeLine = {
  label: string
  value: string
  /** Supplément de cette ligne, en centimes. */
  priceDelta: number
}

/**
 * Valide une valeur de supplément reçue d'un formulaire admin.
 * Renvoie `undefined` si la valeur est inexploitable (l'appelant ignore alors
 * le champ plutôt que d'écrire un prix faux en base).
 */
export function parsePriceDelta(value: unknown): number | undefined {
  if (value === null || value === "") return 0
  const n = typeof value === "string" ? Number(value) : value
  if (typeof n !== "number" || !Number.isFinite(n)) return undefined
  if (n < 0) return undefined
  return Math.round(n)
}

/** Centimes → montant Medusa (euros décimaux), arrondi au centime. */
export function centsToAmount(cents: number): number {
  return Math.round(cents) / 100
}

/**
 * Recalcule le supplément d'une configuration à partir des options en base.
 *
 * - option à choix (color / texture / motif) : supplément du choix sélectionné ;
 * - option "engraving" : forfait `option.price_delta`, compté uniquement si le
 *   client a saisi un texte.
 *
 * Les clés inconnues envoyées par le client sont ignorées (elles ne peuvent
 * donc pas injecter de prix), et une option jamais choisie ne coûte rien.
 */
export function computeSurcharge(
  options: PricedOption[],
  selections: ConfiguratorSelections,
  engraving?: string | null
): { totalCents: number; lines: SurchargeLine[] } {
  const lines: SurchargeLine[] = []
  let totalCents = 0

  for (const option of options ?? []) {
    if (option.type === "engraving") {
      const text = typeof engraving === "string" ? engraving.trim() : ""
      if (!text) continue
      const delta = Math.max(0, Math.round(option.price_delta ?? 0))
      totalCents += delta
      lines.push({ label: option.label, value: text, priceDelta: delta })
      continue
    }

    const choiceKey = selections?.[option.option_key]
    if (!choiceKey) continue
    const choice = (option.choices ?? []).find(
      (c) => c.choice_key === choiceKey
    )
    if (!choice) continue

    const delta = Math.max(0, Math.round(choice.price_delta ?? 0))
    totalCents += delta
    lines.push({ label: option.label, value: choice.label, priceDelta: delta })
  }

  return { totalCents, lines }
}

/**
 * Clés écrites dans le `metadata` de la ligne de panier.
 * DOIT rester aligné avec le storefront (`modules/configurator/lib/persistence.ts`,
 * `CONFIGURATOR_META`) et avec le widget admin « Personnalisation », qui relisent
 * ces mêmes clés.
 */
export const CONFIGURATOR_META = {
  handle: "configurator_handle",
  selections: "configurator_selections",
  engraving: "configurator_engraving",
  options: "configurator_options",
  summary: "configurator_summary",
  priceDelta: "configurator_price_delta",
} as const

/**
 * Construit le `metadata` de la ligne à partir des données de la BASE (jamais
 * de libellés fournis par le client).
 *
 * Déterministe : même configuration ⇒ objet identique. Medusa compare ce
 * metadata (`deepEqualObj`) pour fusionner deux lignes de même variante et même
 * prix (config identique → +1 quantité) ou les séparer (configs différentes).
 */
export function buildLineMetadata(
  handle: string,
  selections: ConfiguratorSelections,
  engraving: string | null | undefined,
  surcharge: { totalCents: number; lines: SurchargeLine[] }
): Record<string, unknown> {
  const summary = surcharge.lines
    .map((l) => `${l.label}: ${l.value}`)
    .join(" · ")

  const metadata: Record<string, unknown> = {
    [CONFIGURATOR_META.handle]: handle,
    [CONFIGURATOR_META.selections]: selections,
    [CONFIGURATOR_META.options]: surcharge.lines.map((l) => ({
      label: l.label,
      value: l.value,
      priceDelta: l.priceDelta,
    })),
    [CONFIGURATOR_META.summary]: summary,
    [CONFIGURATOR_META.priceDelta]: surcharge.totalCents,
  }

  const text = typeof engraving === "string" ? engraving.trim() : ""
  if (text) metadata[CONFIGURATOR_META.engraving] = text

  return metadata
}
