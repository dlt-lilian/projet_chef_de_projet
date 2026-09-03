import { defineLink } from "@medusajs/framework/utils"
import OrderModule from "@medusajs/medusa/order"
import ProductionModule from "../modules/production"

/**
 * Une commande ↔ une étape de fabrication.
 *
 * Ce link n'est pas qu'un confort de requête : c'est lui qui fait entrer
 * `production_status` dans le module graph, ce qui rend ses champs éligibles
 * comme colonnes du tableau /app/orders (feature flag `view_configurations`).
 * Sans link, le statut resterait invisible depuis la liste des commandes.
 *
 * La table de liaison est créée par `medusa db:migrate`.
 */
export default defineLink(
  OrderModule.linkable.order,
  ProductionModule.linkable.productionStatus
)
