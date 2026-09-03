/**
 * Backfill : pose « Commandé » sur les commandes déjà en base.
 *
 * Usage (depuis apps/backend) :
 *   npx medusa exec src/scripts/backfill-production-status.ts
 *
 * Le subscriber `order.placed` ne couvre que les commandes à venir ; celles
 * passées avant l'ajout du module n'ont aucune ligne, et apparaîtraient avec
 * une colonne « Statut » vide dans /app/orders.
 *
 * Idempotent : une commande qui a déjà une étape est laissée telle quelle.
 */

import type { ExecArgs } from "@medusajs/framework/types"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import { setOrderStage } from "../modules/production/set-order-stage"
import { DEFAULT_STAGE } from "../modules/production/stages"

const BATCH_SIZE = 200

export default async function backfillProductionStatus({
  container,
}: ExecArgs) {
  const query = container.resolve(ContainerRegistrationKeys.QUERY)

  let skip = 0
  let scanned = 0
  let created = 0

  for (;;) {
    const { data: orders } = await query.graph({
      entity: "order",
      fields: ["id", "production_status.id"],
      pagination: { skip, take: BATCH_SIZE },
    })

    if (!orders?.length) {
      break
    }

    for (const order of orders) {
      scanned++
      const raw = (order as { production_status?: unknown }).production_status
      const existing = Array.isArray(raw) ? raw[0] : raw
      if (existing) {
        continue
      }

      const ok = await setOrderStage(container, order.id, DEFAULT_STAGE)
      if (ok) {
        created++
      }
    }

    if (orders.length < BATCH_SIZE) {
      break
    }
    skip += BATCH_SIZE
  }

  console.log(`✅ ${scanned} commande(s) examinée(s), ${created} initialisée(s) à « Commandé ».`)
}
