import { getLineItemConfiguration } from "@lib/util/line-item-configuration"

type LineItemConfigurationProps = {
  metadata?: Record<string, unknown> | null
  "data-testid"?: string
}

/**
 * Options du configurateur 3D d'une ligne (couleur, motif, gravure…), lues
 * depuis son `metadata`. Ne rend rien pour les produits non personnalisés.
 * Utilisé dans le panier et le récapitulatif de commande.
 */
const LineItemConfiguration = ({
  metadata,
  "data-testid": dataTestid,
}: LineItemConfigurationProps) => {
  const entries = getLineItemConfiguration(metadata)
  if (!entries.length) return null

  return (
    <ul className="mt-1 flex flex-col gap-y-0.5" data-testid={dataTestid}>
      {entries.map((entry, i) => (
        <li
          key={i}
          className="txt-small text-ui-fg-subtle overflow-hidden text-ellipsis"
        >
          <span className="text-ui-fg-base">{entry.label} :</span> {entry.value}
        </li>
      ))}
    </ul>
  )
}

export default LineItemConfiguration
