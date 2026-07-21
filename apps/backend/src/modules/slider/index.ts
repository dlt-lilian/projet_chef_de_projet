import SliderModuleService from "./service"
import { Module } from "@medusajs/framework/utils"

export const SLIDER_MODULE = "sliderModule"

export default Module(SLIDER_MODULE, {
  service: SliderModuleService,
})
