import BlogModuleService from "./service"
import { Module } from "@medusajs/framework/utils"

export const BLOG_MODULE = "blogModule"

export default Module(BLOG_MODULE, {
  service: BlogModuleService,
})
