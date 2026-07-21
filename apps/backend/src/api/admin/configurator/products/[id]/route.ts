import type {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import { CONFIGURATOR_MODULE } from "../../../../../modules/configurator"
import type ConfiguratorModuleService from "../../../../../modules/configurator/service"

/**
 * PUT /admin/configurator/products/:id
 * Met à jour un produit configurable (chemin du GLB, rotation auto, orientation).
 */
export const PUT = async (
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse
) => {
  const svc: ConfiguratorModuleService = req.scope.resolve(CONFIGURATOR_MODULE)
  const { id } = req.params as { id: string }
  const body = req.body as Record<string, unknown>

  const [existing] = await svc.listConfiguratorProducts({ id })
  if (!existing) {
    return res.status(404).json({ message: `Produit "${id}" introuvable.` })
  }

  const patch: Record<string, unknown> = { id }
  for (const key of ["handle", "glb_path", "auto_rotate", "model_rotation_deg"]) {
    if (key in body) patch[key] = body[key]
  }

  const updated = await svc.updateConfiguratorProducts(patch)

  res.json({ product: Array.isArray(updated) ? updated[0] : updated })
}
