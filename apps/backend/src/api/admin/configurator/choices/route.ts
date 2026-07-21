import type {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import { CONFIGURATOR_MODULE } from "../../../../modules/configurator"
import type ConfiguratorModuleService from "../../../../modules/configurator/service"

/**
 * POST /admin/configurator/choices
 * Ajoute un choix (couleur / motif / texture) à une option.
 *
 * Body : { option_id, choice_key, label, color_hex?, texture_path?,
 *          darken?, rank?, is_default? }
 */
export const POST = async (
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse
) => {
  const svc: ConfiguratorModuleService = req.scope.resolve(CONFIGURATOR_MODULE)
  const body = req.body as Record<string, unknown>

  if (!body.option_id || !body.choice_key || !body.label) {
    return res.status(400).json({
      message: "option_id, choice_key et label sont obligatoires.",
    })
  }

  const choice = await svc.createConfiguratorChoices({
    option_id: body.option_id as string,
    choice_key: body.choice_key as string,
    label: body.label as string,
    color_hex: (body.color_hex as string) ?? null,
    texture_path: (body.texture_path as string) ?? null,
    darken: (body.darken as number) ?? null,
    rank: (body.rank as number) ?? 0,
    is_default: (body.is_default as boolean) ?? false,
  })

  // Un seul choix par défaut par option.
  if (body.is_default) {
    await svc.setDefaultChoice(body.option_id as string, choice.id)
  }

  res.status(201).json({ choice })
}
