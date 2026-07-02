import type {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import { CONFIGURATOR_MODULE } from "../../../../../modules/configurator"
import type ConfiguratorModuleService from "../../../../../modules/configurator/service"

const OPTION_TYPES = ["color", "texture", "motif", "engraving"]

/**
 * PUT /admin/configurator/options/:id
 * Met à jour une option (label, type, mesh ciblé, rang…).
 */
export const PUT = async (
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse
) => {
  const svc: ConfiguratorModuleService = req.scope.resolve(CONFIGURATOR_MODULE)
  const { id } = req.params as { id: string }
  const body = req.body as Record<string, unknown>

  const [existing] = await svc.listConfiguratorOptions({ id })
  if (!existing) {
    return res.status(404).json({ message: `Option "${id}" introuvable.` })
  }

  if ("type" in body && !OPTION_TYPES.includes(body.type as string)) {
    return res.status(400).json({
      message: `type doit être l'un de : ${OPTION_TYPES.join(", ")}.`,
    })
  }

  const patch: Record<string, unknown> = { id }
  for (const key of ["option_key", "label", "type", "target_mesh", "rank"]) {
    if (key in body) patch[key] = body[key]
  }

  const updated = await svc.updateConfiguratorOptions(patch)

  res.json({ option: Array.isArray(updated) ? updated[0] : updated })
}

/**
 * DELETE /admin/configurator/options/:id
 * Supprime l'option et ses choix (voir deleteOptionCascade).
 */
export const DELETE = async (
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse
) => {
  const svc: ConfiguratorModuleService = req.scope.resolve(CONFIGURATOR_MODULE)
  const { id } = req.params as { id: string }

  const [existing] = await svc.listConfiguratorOptions({ id })
  if (!existing) {
    return res.status(404).json({ message: `Option "${id}" introuvable.` })
  }

  await svc.deleteOptionCascade(id)

  res.json({ id, deleted: true })
}
