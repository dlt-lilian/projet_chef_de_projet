import { defineWidgetConfig } from "@medusajs/admin-sdk"
import { DetailWidgetProps, AdminOrder } from "@medusajs/types"
import { Container, Heading, Text } from "@medusajs/ui"
import { useEffect, useState } from "react"

/** Clés écrites par le storefront dans `line_item.metadata`
    (cf. storefront `modules/configurator/lib/persistence.ts`, `CONFIGURATOR_META`). */
const META = {
  options: "configurator_options",
  summary: "configurator_summary",
  selections: "configurator_selections",
  engraving: "configurator_engraving",
  /** Ancienne clé (commandes passées avant le passage au configurateur v2). */
  legacy: "configuration",
} as const

type ConfigurationEntry = {
  label: string
  value: string
  /** Supplément facturé pour cette option, EN CENTIMES (absent = 0 ou ligne
      créée avant la mise en place de la tarification des options). */
  priceDelta?: number
}

/** « + 15,00 € » à partir d'un supplément en centimes ; vide si gratuit. */
function formatSurcharge(cents?: number): string {
  if (!cents) return ""
  return `+ ${(cents / 100).toFixed(2).replace(".", ",")} €`
}

/** Ligne de commande telle qu'on l'exploite ici (sous-ensemble d'AdminOrderLineItem). */
type OrderItem = {
  id: string
  title?: string | null
  product_title?: string | null
  quantity?: number | null
  metadata?: Record<string, unknown> | null
}

/** Filtre un tableau libre de metadata vers des entrées `{ label, value }` sûres. */
function readEntryList(raw: unknown): ConfigurationEntry[] {
  if (!Array.isArray(raw)) return []
  return raw.filter(
    (entry): entry is ConfigurationEntry =>
      !!entry &&
      typeof entry === "object" &&
      typeof (entry as { label?: unknown }).label === "string" &&
      typeof (entry as { value?: unknown }).value === "string"
  )
}

/** Relit le résumé texte (`"Bois: Chêne · Motif: Vagues"`) en entrées. */
function readSummary(raw: unknown): ConfigurationEntry[] {
  if (typeof raw !== "string" || !raw.trim()) return []
  return raw
    .split("·")
    .map((part) => {
      const separator = part.indexOf(":")
      if (separator === -1) return null
      const label = part.slice(0, separator).trim()
      const value = part.slice(separator + 1).trim()
      return label && value ? { label, value } : null
    })
    .filter((entry): entry is ConfigurationEntry => entry !== null)
}

/** Dernier recours : les choix bruts (`{ id_option: id_choix }`) + la gravure. */
function readSelections(
  metadata: Record<string, unknown>
): ConfigurationEntry[] {
  const entries: ConfigurationEntry[] = []
  const raw = metadata[META.selections]

  if (raw && typeof raw === "object" && !Array.isArray(raw)) {
    for (const [optionId, choiceId] of Object.entries(raw)) {
      if (typeof choiceId === "string" && choiceId) {
        entries.push({ label: optionId, value: choiceId })
      }
    }
  }

  const engraving = metadata[META.engraving]
  if (typeof engraving === "string" && engraving.trim()) {
    entries.push({ label: "Gravure", value: engraving })
  }

  return entries
}

/**
 * Lit les options du configurateur 3D d'une ligne. `metadata` est du JSON libre :
 * on tolère l'absence de données et on essaie les formats du plus lisible au
 * plus brut (liste d'options → résumé texte → choix bruts), pour rester
 * compatible avec les commandes déjà passées.
 */
function readConfiguration(
  metadata: Record<string, unknown> | null | undefined
): ConfigurationEntry[] {
  if (!metadata) return []

  const options = readEntryList(metadata[META.options])
  if (options.length) return options

  const legacy = readEntryList(metadata[META.legacy])
  if (legacy.length) return legacy

  const summary = readSummary(metadata[META.summary])
  if (summary.length) return summary

  return readSelections(metadata)
}

/**
 * Récupère les lignes de la commande AVEC leur metadata.
 *
 * `props.data` ne suffit pas : le dashboard charge la commande sans
 * `items.metadata` (ses champs par défaut s'arrêtent à `*items`), donc les
 * options du configurateur en sont absentes — c'est ce qui rendait le widget
 * muet. On repasse donc par l'API, route dédiée d'abord (sélection de champs
 * faite côté serveur), endpoint standard ensuite en repli.
 */
async function fetchOrderItems(orderId: string): Promise<OrderItem[]> {
  const sources = [
    `/admin/configurator/orders/${orderId}`,
    // `encodeURIComponent` est indispensable : un `+` non encodé serait relu
    // comme une espace par le parseur de query d'Express.
    `/admin/orders/${orderId}?fields=${encodeURIComponent(
      "id,*items,+items.metadata"
    )}`,
  ]

  let lastStatus = 0

  for (const url of sources) {
    const res = await fetch(url, { credentials: "include" })
    if (!res.ok) {
      lastStatus = res.status
      continue
    }
    const body = (await res.json()) as {
      items?: OrderItem[]
      order?: { items?: OrderItem[] }
    }
    const items = body.items ?? body.order?.items
    if (items) return items
  }

  throw new Error(`Lignes de la commande ${orderId} illisibles (${lastStatus})`)
}

// Widget affiché sur la fiche commande : liste, pour chaque article, les options
// du configurateur 3D choisies par le client (bois, couleur, motif, gravure…),
// enregistrées dans le metadata de la ligne à l'ajout au panier et recopiées par
// Medusa vers la commande.
const OrderConfigurationWidget = ({ data }: DetailWidgetProps<AdminOrder>) => {
  const [items, setItems] = useState<OrderItem[] | null>(null)
  const [failed, setFailed] = useState(false)

  useEffect(() => {
    let active = true
    setFailed(false)

    fetchOrderItems(data.id)
      .then((fetched) => {
        if (active) setItems(fetched)
      })
      .catch(() => {
        // Repli sur les lignes déjà en mémoire : sans metadata, mais on garde
        // au moins la liste des articles plutôt qu'un widget vide.
        if (active) {
          setItems((data.items ?? []) as OrderItem[])
          setFailed(true)
        }
      })

    return () => {
      active = false
    }
  }, [data.id])

  const configuredItems = (items ?? [])
    .map((item) => ({ item, entries: readConfiguration(item.metadata) }))
    .filter(({ entries }) => entries.length > 0)

  return (
    <Container className="divide-y divide-ui-border-base p-0">
      <div className="px-6 py-4">
        <Heading level="h2">Personnalisation</Heading>
        <Text size="small" className="text-ui-fg-muted">
          Options choisies par le client dans le configurateur 3D.
        </Text>
      </div>

      {items === null ? (
        <div className="px-6 py-4">
          <Text size="small" className="text-ui-fg-muted">
            Chargement…
          </Text>
        </div>
      ) : configuredItems.length === 0 ? (
        <div className="px-6 py-4">
          <Text size="small" className="text-ui-fg-muted">
            {failed
              ? "Impossible de charger les options de cette commande."
              : "Aucun article personnalisé dans cette commande."}
          </Text>
        </div>
      ) : (
        <div className="flex flex-col divide-y divide-ui-border-base">
          {configuredItems.map(({ item, entries }) => (
            <div key={item.id} className="px-6 py-4">
              <div className="mb-2 flex items-center gap-x-2">
                <Text weight="plus" size="small">
                  {item.product_title ?? item.title ?? "Article"}
                </Text>
                {item.quantity && item.quantity > 1 ? (
                  <Text size="small" className="text-ui-fg-muted">
                    × {item.quantity}
                  </Text>
                ) : null}
              </div>
              <ul className="flex flex-col gap-y-1">
                {entries.map((entry, i) => (
                  <li
                    key={`${entry.label}-${i}`}
                    className="flex gap-x-3 text-sm"
                  >
                    <span className="min-w-[160px] shrink-0 text-ui-fg-muted">
                      {entry.label}
                    </span>
                    <span className="whitespace-pre-wrap text-ui-fg-base">
                      {entry.value}
                    </span>
                    {/* Supplément déjà compris dans le prix de la ligne : montré
                        pour justifier l'écart avec le tarif catalogue. */}
                    {entry.priceDelta ? (
                      <span className="ml-auto shrink-0 text-ui-fg-muted">
                        {formatSurcharge(entry.priceDelta)}
                      </span>
                    ) : null}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      )}
    </Container>
  )
}

export const config = defineWidgetConfig({
  zone: "order.details.before",
})

export default OrderConfigurationWidget
