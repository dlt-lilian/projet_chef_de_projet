import type {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import { CONFIGURATOR_MODULE } from "../../../modules/configurator"
import type ConfiguratorModuleService from "../../../modules/configurator/service"

/**
 * GET /admin/configurator
 * Tous les produits configurables avec options + choix (triés par rank).
 */
export const GET = async (
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse
) => {
  const svc: ConfiguratorModuleService = req.scope.resolve(CONFIGURATOR_MODULE)

  const products = await svc.listConfigForAdmin()

  const sorted = products
    .map((p: any) => ({
      ...p,
      options: [...(p.options ?? [])]
        .sort((a: any, b: any) => (a.rank ?? 0) - (b.rank ?? 0))
        .map((o: any) => ({
          ...o,
          choices: [...(o.choices ?? [])].sort(
            (a: any, b: any) => (a.rank ?? 0) - (b.rank ?? 0)
          ),
        })),
    }))
    .sort((a: any, b: any) => a.handle.localeCompare(b.handle))

  res.json({ products: sorted, count: sorted.length })
}
