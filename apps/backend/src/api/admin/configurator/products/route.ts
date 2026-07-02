import type {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import { CONFIGURATOR_MODULE } from "../../../../modules/configurator"
import type ConfiguratorModuleService from "../../../../modules/configurator/service"

/**
 * POST /admin/configurator/products
 * Crée un nouveau produit configurable. Le fichier .glb doit déjà exister
 * dans apps/storefront/public/3d/ — cette route ne fait que le référencer.
 *
 * Body : { handle, glb_path, auto_rotate?, model_rotation_deg? }
 */
export const POST = async (
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse
) => {
  const svc: ConfiguratorModuleService = req.scope.resolve(CONFIGURATOR_MODULE)
  const body = req.body as Record<string, unknown>

  if (!body.handle || !body.glb_path) {
    return res.status(400).json({
      message: "handle et glb_path sont obligatoires.",
    })
  }

  const [existing] = await svc.listConfiguratorProducts({
    handle: body.handle as string,
  })
  if (existing) {
    return res.status(409).json({
      message: `Un produit configurable "${body.handle}" existe déjà.`,
    })
  }

  const product = await svc.createConfiguratorProducts({
    handle: body.handle as string,
    glb_path: body.glb_path as string,
    auto_rotate: (body.auto_rotate as boolean) ?? true,
    // json() est typé Record<…> par Medusa DML, mais on y stocke un [x, y, z].
    model_rotation_deg: (body.model_rotation_deg ?? null) as unknown as
      | Record<string, unknown>
      | null,
  })

  res.status(201).json({ product })
}
