import { MedusaService } from "@medusajs/framework/utils"
import ProductionStatus from "./models/production-status"

class ProductionModuleService extends MedusaService({ ProductionStatus }) {}

export default ProductionModuleService
