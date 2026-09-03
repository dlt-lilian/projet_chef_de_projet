import type {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import {
  readOrderStage,
  setOrderStage,
} from "../../../../modules/production/set-order-stage"
import { isStage, labelOf } from "../../../../modules/production/stages"

/**
 * GET /admin/production/:orderId
 * Étape de fabrication d'une commande. Une commande sans ligne enregistrée est
 * réputée « Commandé » : c'est l'état de départ, pas une absence de donnée.
 */
export const GET = async (
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse
) => {
  const { orderId } = req.params as { orderId: string }
  const { found, stage } = await readOrderStage(req.scope, orderId)

  if (!found) {
    return res
      .status(404)
      .json({ message: `Commande "${orderId}" introuvable.` })
  }

  res.json({ stage, label: labelOf(stage) })
}

/**
 * POST /admin/production/:orderId  { stage }
 * Crée ou met à jour l'étape. Le `label` est dérivé du `stage` côté serveur
 * pour que la colonne du tableau /app/orders ne puisse pas désynchroniser.
 */
export const POST = async (
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse
) => {
  const { orderId } = req.params as { orderId: string }
  const { stage } = (req.body ?? {}) as { stage?: unknown }

  if (!isStage(stage)) {
    return res
      .status(400)
      .json({ message: `Étape inconnue : « ${String(stage)} ».` })
  }

  const updated = await setOrderStage(req.scope, orderId, stage)
  if (!updated) {
    return res
      .status(404)
      .json({ message: `Commande "${orderId}" introuvable.` })
  }

  res.json({ stage, label: labelOf(stage) })
}
