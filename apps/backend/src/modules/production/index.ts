import ProductionModuleService from "./service"
import { Module } from "@medusajs/framework/utils"

export const PRODUCTION_MODULE = "productionModule"

export default Module(PRODUCTION_MODULE, {
  service: ProductionModuleService,
})
