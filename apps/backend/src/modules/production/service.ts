import { MedusaService } from "@medusajs/framework/utils"
import ProductionStatus from "./models/production-status"
import type { Stage } from "./stages"

type StatusRow = { id: string; stage: Stage; label: string }

/**
 * Les méthodes générées portent le nom du modèle au pluriel. Au runtime c'est
 * `pluralize()` qui l'applique (→ `ProductionStatuses`), mais son équivalent au
 * niveau des types laisse les mots déjà terminés par « s » intacts (→
 * `ProductionStatus`). Les méthodes existent donc bel et bien à l'exécution,
 * mais `tsc` ne les voit pas : on les redéclare ici.
 *
 * Ne PAS suivre la suggestion du compilateur (`createProductionStatus`, au
 * singulier) : le build passerait, et l'appel exploserait au premier
 * `order.placed`.
 *
 * `declare` est important : un champ de classe, même sans initialiseur,
 * écraserait la méthode du prototype si `useDefineForClassFields` passait à
 * true (target ≥ ES2022).
 */
class ProductionModuleService extends MedusaService({ ProductionStatus }) {
  declare createProductionStatuses: (
    data: Omit<StatusRow, "id">
  ) => Promise<StatusRow | StatusRow[]>

  declare updateProductionStatuses: (
    data: Partial<StatusRow> & { id: string }
  ) => Promise<StatusRow | StatusRow[]>
}

export default ProductionModuleService
