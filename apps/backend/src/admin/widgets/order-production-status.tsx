import { defineWidgetConfig } from "@medusajs/admin-sdk"
import { DetailWidgetProps, AdminOrder } from "@medusajs/types"
import { Badge, Button, Container, Heading, Text, toast } from "@medusajs/ui"
import { useState } from "react"

/**
 * Suivi de fabrication : étape d'avancement propre à l'atelier, choisie en un
 * clic depuis la fiche commande.
 *
 * Volontairement INDÉPENDANT du `fulfillment_status` natif de Medusa (qui, lui,
 * découle des expéditions réellement créées) : on ne veut pas qu'un clic ici
 * déclenche un vrai fulfillment. Les deux cohabitent, celui-ci est informatif.
 *
 * Stocké dans `order.metadata`, donc lisible côté storefront si on veut un jour
 * l'afficher au client.
 */
const META_KEY = "production_status"

const STAGES = [
  { value: "ordered", label: "Commandé" },
  { value: "in_production", label: "En cours de fabrication" },
  { value: "shipping", label: "En cours d'expédition" },
  { value: "shipped", label: "Expédié" },
  { value: "delivered", label: "Livré" },
] as const

type Stage = (typeof STAGES)[number]["value"]

type Metadata = Record<string, unknown>

function labelOf(stage: Stage): string {
  return STAGES.find((s) => s.value === stage)!.label
}

/** Relit l'étape depuis le metadata en ignorant toute valeur inconnue. */
function readStage(metadata: Metadata): Stage | null {
  const raw = metadata[META_KEY]
  return STAGES.some((s) => s.value === raw) ? (raw as Stage) : null
}

async function errorMessage(res: Response, fallback: string): Promise<string> {
  const body = await res.json().catch(() => null)
  return (body?.message as string) || fallback
}

const OrderProductionStatusWidget = ({ data }: DetailWidgetProps<AdminOrder>) => {
  // On suit le metadata complet, pas seulement l'étape : c'est lui qu'on
  // renvoie à chaque enregistrement, et il doit rester à jour entre deux clics.
  const [metadata, setMetadata] = useState<Metadata>(
    (data.metadata as Metadata | null) ?? {}
  )
  const [pending, setPending] = useState<Stage | null>(null)

  const current = readStage(metadata)
  const currentIndex = STAGES.findIndex((s) => s.value === current)

  const select = async (next: Stage) => {
    if (pending || next === current) {
      return
    }

    const previous = metadata
    // `POST /admin/orders/:id` réécrit `metadata` en entier : on repart de
    // l'existant pour ne pas effacer les autres clés de la commande.
    const optimistic = { ...metadata, [META_KEY]: next }

    setMetadata(optimistic)
    setPending(next)

    try {
      const res = await fetch(`/admin/orders/${data.id}`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ metadata: optimistic }),
      })
      if (!res.ok) {
        throw new Error(await errorMessage(res, "Échec de l'enregistrement"))
      }
      toast.success(`Statut : ${labelOf(next)}`)
    } catch (e) {
      setMetadata(previous)
      toast.error(
        e instanceof Error ? e.message : "Échec de l'enregistrement"
      )
    } finally {
      setPending(null)
    }
  }

  return (
    <Container className="divide-y divide-ui-border-base p-0">
      <div className="flex items-center justify-between px-6 py-4">
        <div>
          <Heading level="h2">Suivi de fabrication</Heading>
          <Text size="small" className="text-ui-fg-muted">
            Avancement interne de la commande, indépendant du statut
            d'expédition Medusa.
          </Text>
        </div>
        {current ? (
          <Badge size="2xsmall" color="green">
            {labelOf(current)}
          </Badge>
        ) : (
          <Badge size="2xsmall" color="grey">
            Non défini
          </Badge>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-2 px-6 py-4">
        {STAGES.map((stage, i) => {
          const isCurrent = stage.value === current
          // Étapes déjà franchies : atténuées, pour lire l'avancement d'un
          // coup d'œil sans empêcher de revenir en arrière.
          const isDone = currentIndex > -1 && i < currentIndex
          return (
            <Button
              key={stage.value}
              size="small"
              variant={isCurrent ? "primary" : "secondary"}
              onClick={() => select(stage.value)}
              isLoading={pending === stage.value}
              disabled={pending !== null}
              className={isDone ? "text-ui-fg-muted" : undefined}
            >
              {stage.label}
            </Button>
          )
        })}
      </div>
    </Container>
  )
}

export const config = defineWidgetConfig({
  zone: "order.details.before",
})

export default OrderProductionStatusWidget
