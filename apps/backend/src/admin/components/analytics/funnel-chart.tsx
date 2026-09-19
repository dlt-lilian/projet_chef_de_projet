import { Heading, Text } from "@medusajs/ui"
import { useChartTheme } from "./chart-theme"
import { formatPercent } from "./format"

export type Funnel = {
  with_items: number
  with_contact: number
  with_shipping: number
  completed: number
}

/**
 * Entonnoir panier → commande.
 *
 * Des barres horizontales, pas un trapèze : dans un entonnoir dessiné en
 * trapèze, l'œil compare des aires dont la largeur ne code rien, et l'écart
 * entre deux étapes proches devient illisible. Ici chaque étape est une
 * longueur sur une base commune, et son effectif est écrit à côté.
 *
 * Les étapes sont ordonnées : même teinte, du clair au foncé (échelle ordinale)
 * — la couleur suit la position dans le parcours, pas la valeur.
 */

const STEPS: { key: keyof Funnel; label: string; hint: string }[] = [
  {
    key: "with_items",
    label: "Panier rempli",
    hint: "Au moins un article ajouté",
  },
  {
    key: "with_contact",
    label: "Coordonnées saisies",
    hint: "E-mail ou adresse renseignés",
  },
  {
    key: "with_shipping",
    label: "Livraison choisie",
    hint: "Mode d'expédition sélectionné",
  },
  { key: "completed", label: "Commandé", hint: "Panier converti en commande" },
]

export function FunnelChart({ funnel }: { funnel: Funnel }) {
  const theme = useChartTheme()
  const base = funnel.with_items

  if (!base) {
    return (
      <div className="flex flex-col gap-y-2">
        <Heading level="h3">Du panier à la commande</Heading>
        <Text size="small" className="text-ui-fg-muted">
          Aucun panier arrivé à maturité sur cette période.
        </Text>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-y-2">
      <div>
        <Heading level="h3">Du panier à la commande</Heading>
        <Text size="xsmall" className="text-ui-fg-muted">
          Part des paniers de la période atteignant chaque étape. La perte entre
          deux étapes dit où l'on décroche.
        </Text>
      </div>

      <div className="flex flex-col">
        {STEPS.map((step, index) => {
          const value = funnel[step.key]
          const share = value / base
          const previous = index > 0 ? funnel[STEPS[index - 1].key] : null
          const lost = previous == null ? 0 : previous - value

          return (
            <div key={step.key} className="flex flex-col">
              {/* Perte par rapport à l'étape précédente, intercalée pour se
                  lire comme une marche entre deux barres. */}
              {previous != null ? (
                <div className="flex items-center gap-x-2 py-2 pl-3">
                  <div
                    className="h-4 w-px"
                    style={{ backgroundColor: theme.grid }}
                  />
                  <Text size="xsmall" className="text-ui-fg-muted">
                    {lost > 0
                      ? `− ${lost} panier${lost > 1 ? "s" : ""} (${formatPercent(
                          lost / previous
                        )} de l'étape précédente)`
                      : "Aucune perte"}
                  </Text>
                </div>
              ) : null}

              <div className="flex flex-col gap-y-1">
                <div className="flex items-baseline justify-between gap-x-3">
                  <Text size="small" className="text-ui-fg-base">
                    {step.label}
                  </Text>
                  <Text size="small" weight="plus" className="text-ui-fg-base">
                    {value}{" "}
                    <span className="text-ui-fg-muted">
                      · {formatPercent(share, 0)}
                    </span>
                  </Text>
                </div>
                <Text size="xsmall" className="text-ui-fg-subtle">
                  {step.hint}
                </Text>
                <div
                  className="h-3 w-full overflow-hidden rounded"
                  style={{ backgroundColor: theme.track }}
                  role="img"
                  aria-label={`${step.label} : ${value} paniers, ${formatPercent(
                    share,
                    0
                  )} du départ`}
                >
                  <div
                    className="h-full rounded"
                    style={{
                      width: `${Math.max(share * 100, share > 0 ? 1 : 0)}%`,
                      backgroundColor: theme.ordinal[index],
                    }}
                  />
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
