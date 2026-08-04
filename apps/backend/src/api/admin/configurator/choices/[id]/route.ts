import type {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import { CONFIGURATOR_MODULE } from "../../../../../modules/configurator"
import type ConfiguratorModuleService from "../../../../../modules/configurator/service"
import { parsePriceDelta } from "../../../../../modules/configurator/price"

/**
 * PUT /admin/configurator/choices/:id
 * Met à jour un choix (label, couleur, texture, supplément, rang, défaut…).
 */
export const PUT = async (
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse
) => {
  const svc: ConfiguratorModuleService = req.scope.resolve(CONFIGURATOR_MODULE)
  const { id } = req.params as { id: string }
  const body = req.body as Record<string, unknown>

  const [existing] = await svc.listConfiguratorChoices({ id })
  if (!existing) {
    return res.status(404).json({ message: `Choix "${id}" introuvable.` })
  }

  // Ne met à jour que les champs fournis (patch partiel).
  const patch: Record<string, unknown> = { id }
  for (const key of [
    "choice_key",
    "label",
    "color_hex",
    "texture_path",
    "darken",
    "rank",
    "is_default",
  ]) {
    if (key in body) patch[key] = body[key]
  }

  if ("price_delta" in body) {
    const priceDelta = parsePriceDelta(body.price_delta)
    if (priceDelta === undefined) {
      return res.status(400).json({
        message: "price_delta doit être un nombre de centimes positif ou nul.",
      })
    }
    patch.price_delta = priceDelta
  }

  const updated = await svc.updateConfiguratorChoices(patch)

  if (body.is_default === true) {
    await svc.setDefaultChoice(existing.option_id as string, id)
  }

  res.json({ choice: Array.isArray(updated) ? updated[0] : updated })
}

/**
 * DELETE /admin/configurator/choices/:id
 */
export const DELETE = async (
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse
) => {
  const svc: ConfiguratorModuleService = req.scope.resolve(CONFIGURATOR_MODULE)
  const { id } = req.params as { id: string }

  await svc.deleteConfiguratorChoices(id)

  res.json({ id, deleted: true })
}
