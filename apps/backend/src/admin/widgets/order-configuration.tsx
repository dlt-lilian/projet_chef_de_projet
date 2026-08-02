import { defineWidgetConfig } from "@medusajs/admin-sdk"
import { DetailWidgetProps, AdminOrder } from "@medusajs/types"
import { Container, Heading, Text } from "@medusajs/ui"

/** Clé sous laquelle le storefront range les options dans `line_item.metadata`
    (cf. storefront `modules/configurator/lib/persistence.ts`,
    `CONFIGURATOR_META.options`). */
const CONFIGURATOR_OPTIONS_KEY = "configurator_options"

type ConfigurationEntry = { label: string; value: string }

/** Lit les options du configurateur 3D d'une ligne, en tolérant un metadata
    absent ou malformé (JSON libre). */
function readConfiguration(
  metadata: Record<string, unknown> | null | undefined
): ConfigurationEntry[] {
  const raw = metadata?.[CONFIGURATOR_OPTIONS_KEY]
  if (!Array.isArray(raw)) return []
  return raw.filter(
    (entry): entry is ConfigurationEntry =>
      !!entry &&
      typeof entry === "object" &&
      typeof (entry as { label?: unknown }).label === "string" &&
      typeof (entry as { value?: unknown }).value === "string"
  )
}

// Widget affiché sous la fiche commande : liste, pour chaque article, les
// options du configurateur 3D choisies par le client (couleur, motif, gravure…),
// enregistrées dans le metadata de la ligne à l'ajout au panier. Masqué si
// aucune ligne de la commande n'est personnalisée.
const OrderConfigurationWidget = ({ data }: DetailWidgetProps<AdminOrder>) => {
  const configuredItems = (data.items ?? [])
    .map((item) => ({ item, entries: readConfiguration(item.metadata) }))
    .filter(({ entries }) => entries.length > 0)

  if (!configuredItems.length) {
    return null
  }

  return (
    <Container className="divide-y divide-ui-border-base p-0">
      <div className="px-6 py-4">
        <Heading level="h2">Personnalisation</Heading>
        <Text size="small" className="text-ui-fg-muted">
          Options choisies par le client dans le configurateur 3D.
        </Text>
      </div>
      <div className="flex flex-col divide-y divide-ui-border-base">
        {configuredItems.map(({ item, entries }) => (
          <div key={item.id} className="px-6 py-4">
            <Text weight="plus" size="small" className="mb-2">
              {item.product_title ?? item.title}
            </Text>
            <ul className="flex flex-col gap-y-1">
              {entries.map((entry, i) => (
                <li key={i} className="flex gap-x-3 text-sm">
                  <span className="min-w-[160px] text-ui-fg-muted">
                    {entry.label}
                  </span>
                  <span className="text-ui-fg-base">{entry.value}</span>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </Container>
  )
}

export const config = defineWidgetConfig({
  zone: "order.details.after",
})

export default OrderConfigurationWidget
