import ConfiguratorModuleService from "./service"
import { Module } from "@medusajs/framework/utils"

export const CONFIGURATOR_MODULE = "configuratorModule"

export default Module(CONFIGURATOR_MODULE, {
  service: ConfiguratorModuleService,
})
