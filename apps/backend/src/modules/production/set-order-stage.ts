import { ContainerRegistrationKeys, Modules } from "@medusajs/framework/utils"
import type { MedusaContainer } from "@medusajs/framework/types"
import { PRODUCTION_MODULE } from "."
import type ProductionModuleService from "./service"
import { DEFAULT_STAGE, isStage, labelOf, type Stage } from "./stages"

/**
 * Lecture / écriture de l'étape de fabrication d'une commande.
 *
 * Regroupé ici parce que trois appelants en ont besoin — la route admin, le
 * subscriber `order.placed` et le script de backfill — et que la partie
 * délicate (créer la ligne PUIS le link, une seule fois) ne doit exister qu'en
 * un exemplaire.
 */

type OrderStage = {
  /** `false` si la commande elle-même n'existe pas. */
  found: boolean
  /** Étape courante ; `DEFAULT_STAGE` tant qu'aucune ligne n'est enregistrée. */
  stage: Stage
  /** Id de la ligne existante, `null` s'il faut encore la créer. */
  statusId: string | null
}

export async function readOrderStage(
  container: MedusaContainer,
  orderId: string
): Promise<OrderStage> {
  const query = container.resolve(ContainerRegistrationKeys.QUERY)
  const { data } = await query.graph({
    entity: "order",
    fields: ["id", "production_status.id", "production_status.stage"],
    filters: { id: orderId },
  })

  const order = data?.[0] as
    | { production_status?: unknown }
    | undefined
  if (!order) {
    return { found: false, stage: DEFAULT_STAGE, statusId: null }
  }

  // Le link est un un-à-un, mais `query.graph` renvoie parfois un tableau :
  // on normalise pour ne pas dépendre de la forme exacte.
  const raw = order.production_status
  const row = (Array.isArray(raw) ? raw[0] : raw) as
    | { id?: string; stage?: unknown }
    | null
    | undefined

  // Variable intermédiaire indispensable : le narrowing de `isStage` ne
  // survivrait pas à une seconde lecture de `row?.stage`.
  const rawStage: unknown = row?.stage

  return {
    found: true,
    stage: isStage(rawStage) ? rawStage : DEFAULT_STAGE,
    statusId: row?.id ?? null,
  }
}

/**
 * Pose l'étape sur une commande, en créant la ligne et son link au premier
 * appel. Renvoie `false` si la commande est introuvable.
 */
export async function setOrderStage(
  container: MedusaContainer,
  orderId: string,
  stage: Stage
): Promise<boolean> {
  const { found, statusId } = await readOrderStage(container, orderId)
  if (!found) {
    return false
  }

  const svc: ProductionModuleService = container.resolve(PRODUCTION_MODULE)
  const label = labelOf(stage)

  if (statusId) {
    await svc.updateProductionStatuses({ id: statusId, stage, label })
    return true
  }

  const created = await svc.createProductionStatuses({ stage, label })
  const row = Array.isArray(created) ? created[0] : created

  const link = container.resolve(ContainerRegistrationKeys.LINK)
  await link.create({
    [Modules.ORDER]: { order_id: orderId },
    [PRODUCTION_MODULE]: { production_status_id: row.id },
  })

  return true
}
