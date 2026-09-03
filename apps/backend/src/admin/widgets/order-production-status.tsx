import { defineWidgetConfig } from "@medusajs/admin-sdk"
import { DetailWidgetProps, AdminOrder } from "@medusajs/types"
import { Badge, Button, Container, Heading, Text, toast } from "@medusajs/ui"
import { useEffect, useState } from "react"
import {
  DEFAULT_STAGE,
  STAGES,
  isStage,
  labelOf,
  type Stage,
} from "../../modules/production/stages"

/**
 * Suivi de fabrication : étape d'avancement propre à l'atelier, choisie en un
 * clic depuis la fiche commande.
 *
 * Volontairement INDÉPENDANT du `fulfillment_status` natif de Medusa (qui, lui,
 * découle des expéditions réellement créées) : on ne veut pas qu'un clic ici
 * déclenche un vrai fulfillment. Les deux cohabitent, celui-ci est informatif.
 *
 * L'étape vit dans le module `production`, lié à Order — et non dans le
 * metadata de la commande — pour pouvoir remonter comme colonne du tableau
 * /app/orders.
 */
async function errorMessage(res: Response, fallback: string): Promise<string> {
  const body = await res.json().catch(() => null)
  return (body?.message as string) || fallback
}

const OrderProductionStatusWidget = ({ data }: DetailWidgetProps<AdminOrder>) => {
  const [stage, setStage] = useState<Stage | null>(null)
  const [pending, setPending] = useState<Stage | null>(null)

  useEffect(() => {
    let active = true

    fetch(`/admin/production/${data.id}`, { credentials: "include" })
      .then((res) => (res.ok ? res.json() : null))
      .then((body) => {
        if (!active) return
        setStage(isStage(body?.stage) ? body.stage : DEFAULT_STAGE)
      })
      .catch(() => {
        // Statut illisible : on retombe sur l'étape de départ plutôt que de
        // laisser la carte vide, le prochain clic réécrira la valeur.
        if (active) setStage(DEFAULT_STAGE)
      })

    return () => {
      active = false
    }
  }, [data.id])

  const select = async (next: Stage) => {
    if (pending || next === stage) {
      return
    }

    const previous = stage
    setStage(next)
    setPending(next)

    try {
      const res = await fetch(`/admin/production/${data.id}`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ stage: next }),
      })
      if (!res.ok) {
        throw new Error(await errorMessage(res, "Échec de l'enregistrement"))
      }
      toast.success(`Statut : ${labelOf(next)}`)
    } catch (e) {
      setStage(previous)
      toast.error(e instanceof Error ? e.message : "Échec de l'enregistrement")
    } finally {
      setPending(null)
    }
  }

  const currentIndex = STAGES.findIndex((s) => s.value === stage)

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
        {stage && (
          <Badge
            size="2xsmall"
            color={stage === "delivered" ? "green" : "orange"}
          >
            {labelOf(stage)}
          </Badge>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-2 px-6 py-4">
        {stage === null ? (
          <Text size="small" className="text-ui-fg-muted">
            Chargement…
          </Text>
        ) : (
          STAGES.map((s, i) => {
            const isCurrent = s.value === stage
            // Étapes déjà franchies : atténuées, pour lire l'avancement d'un
            // coup d'œil sans empêcher de revenir en arrière.
            const isDone = i < currentIndex
            return (
              <Button
                key={s.value}
                size="small"
                variant={isCurrent ? "primary" : "secondary"}
                onClick={() => select(s.value)}
                isLoading={pending === s.value}
                disabled={pending !== null}
                className={isDone ? "text-ui-fg-muted" : undefined}
              >
                {s.label}
              </Button>
            )
          })
        )}
      </div>
    </Container>
  )
}

export const config = defineWidgetConfig({
  zone: "order.details.before",
})

export default OrderProductionStatusWidget
