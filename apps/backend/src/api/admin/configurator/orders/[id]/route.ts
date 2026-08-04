import type {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"

/**
 * GET /admin/configurator/orders/:id
 *
 * Renvoie les lignes d'une commande AVEC leur `metadata`, où le storefront range
 * les choix du configurateur 3D (cf. `modules/configurator/lib/persistence.ts`).
 *
 * Pourquoi une route dédiée : le dashboard admin charge la commande sans
 * `items.metadata` (ses champs par défaut s'arrêtent à `*items`), donc le widget
 * « Personnalisation » ne voyait jamais les options. Ici la sélection de champs
 * est faite côté serveur, elle ne dépend d'aucun paramètre de requête.
 */
export const GET = async (
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse
) => {
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)
  const { id } = req.params as { id: string }

  const { data } = await query.graph({
    entity: "order",
    fields: [
      "id",
      "items.id",
      "items.title",
      "items.product_title",
      "items.quantity",
      "items.metadata",
    ],
    filters: { id },
  })

  const order = data?.[0]
  if (!order) {
    return res.status(404).json({ message: `Commande "${id}" introuvable.` })
  }

  res.json({ items: order.items ?? [] })
}
