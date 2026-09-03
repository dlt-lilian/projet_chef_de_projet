import type { SubscriberArgs, SubscriberConfig } from "@medusajs/framework"
import { setOrderStage } from "../modules/production/set-order-stage"
import { DEFAULT_STAGE } from "../modules/production/stages"

/**
 * Pose « Commandé » sur toute nouvelle commande.
 *
 * Sans ça, la colonne « Statut » du tableau /app/orders resterait vide pour les
 * commandes fraîches : le widget sait afficher une valeur par défaut, mais le
 * tableau, lui, lit la base telle quelle.
 */
export default async function setInitialProductionStatus({
  event: { data },
  container,
}: SubscriberArgs<{ id: string }>) {
  await setOrderStage(container, data.id, DEFAULT_STAGE)
}

export const config: SubscriberConfig = {
  event: "order.placed",
}
