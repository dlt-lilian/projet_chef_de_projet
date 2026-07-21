import type {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import { CONFIGURATOR_MODULE } from "../../../../modules/configurator"
import type ConfiguratorModuleService from "../../../../modules/configurator/service"

const OPTION_TYPES = ["color", "texture", "motif", "engraving"]

/**
 * POST /admin/configurator/options
 * Crée une option (axe de personnalisation) pour un produit configurable.
 *
 * Body : { product_id, option_key, label, type, target_mesh?, rank? }
 * target_mesh peut être une chaîne ("Papier") ou un tableau (["vis_1","vis_2"]).
 */
export const POST = async (
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse
) => {
  const svc: ConfiguratorModuleService = req.scope.resolve(CONFIGURATOR_MODULE)
  const body = req.body as Record<string, unknown>

  if (!body.product_id || !body.option_key || !body.label || !body.type) {
    return res.status(400).json({
      message: "product_id, option_key, label et type sont obligatoires.",
    })
  }
  if (!OPTION_TYPES.includes(body.type as string)) {
    return res.status(400).json({
      message: `type doit être l'un de : ${OPTION_TYPES.join(", ")}.`,
    })
  }

  const option = await svc.createConfiguratorOptions({
    product_id: body.product_id as string,
    option_key: body.option_key as string,
    label: body.label as string,
    // Validé ci-dessus par OPTION_TYPES ; cast vers l'union enum du modèle.
    type: body.type as "color" | "texture" | "motif" | "engraving",
    // json() est typé Record<…> par Medusa DML, mais target_mesh est string|string[].
    target_mesh: (body.target_mesh ?? null) as unknown as
      | Record<string, unknown>
      | null,
    rank: (body.rank as number) ?? 0,
  })

  res.status(201).json({ option })
}
