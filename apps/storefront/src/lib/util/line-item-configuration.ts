/**
 * Options de personnalisation (configurateur 3D) rattachées à une ligne de
 * commande via son `metadata`.
 *
 * Écrites à l'ajout au panier (ConfiguratorSidebar), recopiées automatiquement
 * du panier vers la commande par Medusa à la validation, puis relues côté client
 * (panier / récap commande) et côté admin (widget « Personnalisation »).
 */

/** Clé sous laquelle les options sont rangées dans `line_item.metadata`. */
export const LINE_ITEM_CONFIG_KEY = "configuration"

/** Une option retenue : intitulé de l'option + valeur choisie. */
export type ConfigurationEntry = { label: string; value: string }

/**
 * Extrait les options de personnalisation d'un `metadata` de ligne, en tolérant
 * les données absentes ou malformées (`metadata` est du JSON libre : on ne peut
 * pas présumer de sa forme).
 */
export function getLineItemConfiguration(
  metadata: Record<string, unknown> | null | undefined
): ConfigurationEntry[] {
  const raw = metadata?.[LINE_ITEM_CONFIG_KEY]
  if (!Array.isArray(raw)) return []
  return raw.filter(
    (entry): entry is ConfigurationEntry =>
      !!entry &&
      typeof entry === "object" &&
      typeof (entry as { label?: unknown }).label === "string" &&
      typeof (entry as { value?: unknown }).value === "string"
  )
}
