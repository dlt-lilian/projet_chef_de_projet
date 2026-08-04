import { HttpTypes } from "@medusajs/types"
import { Text } from "@modules/common/components/ui"
import { readConfiguratorLineOptions } from "@modules/configurator/lib/persistence"

type LineItemOptionsProps = {
  variant: HttpTypes.StoreProductVariant | undefined
  /** Metadata de la ligne : si elle contient une config 3D, on l'affiche. */
  metadata?: Record<string, unknown> | null
  "data-testid"?: string
  "data-value"?: HttpTypes.StoreProductVariant
}

const LineItemOptions = ({
  variant,
  metadata,
  "data-testid": dataTestid,
  "data-value": dataValue,
}: LineItemOptionsProps) => {
  // Ligne issue du configurateur 3D → on liste les choix (bois, couleur, motif,
  // gravure…) au lieu du simple libellé de variante.
  const configured = readConfiguratorLineOptions(metadata)
  if (configured) {
    return (
      <div data-testid={dataTestid} className="mt-1 flex flex-col gap-y-0.5">
        {configured.map((option) => (
          <Text
            key={option.label}
            className="txt-medium w-full overflow-hidden text-ellipsis text-ui-fg-subtle"
          >
            <span className="text-ui-fg-muted">{option.label} :</span>{" "}
            {option.value}
            {/* Supplément déjà compris dans le prix de la ligne : rappelé ici
                pour que le client sache d'où vient l'écart avec le prix affiché
                en boutique. */}
            {!!option.priceDelta && (
              <span className="text-ui-fg-muted">
                {" "}
                (+{(option.priceDelta / 100).toFixed(2).replace(".", ",")} €)
              </span>
            )}
          </Text>
        ))}
      </div>
    )
  }

  return (
    <Text
      data-testid={dataTestid}
      data-value={dataValue}
      className="inline-block txt-medium text-ui-fg-subtle w-full overflow-hidden text-ellipsis"
    >
      Variant: {variant?.title}
    </Text>
  )
}

export default LineItemOptions
