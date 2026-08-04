import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { CONFIGURATOR_MODULE } from "../../../../modules/configurator"
import type ConfiguratorModuleService from "../../../../modules/configurator/service"

/**
 * GET /store/configurator/:handle
 *
 * Renvoie la configuration d'un produit dans la forme attendue par le
 * storefront (ConfiguratorProductConfig) : mapping snake_case → camelCase et
 * tri des options/choix par `rank`.
 */
export const GET = async (req: MedusaRequest, res: MedusaResponse) => {
  const svc: ConfiguratorModuleService = req.scope.resolve(CONFIGURATOR_MODULE)
  const { handle } = req.params as { handle: string }

  const product = await svc.getConfigByHandle(handle)
  if (!product) {
    return res
      .status(404)
      .json({ message: `Configuration introuvable pour "${handle}".` })
  }

  const options = [...((product.options as any[]) ?? [])]
    .sort((a, b) => (a.rank ?? 0) - (b.rank ?? 0))
    .map((o) => ({
      id: o.option_key,
      label: o.label,
      type: o.type,
      targetMesh: o.target_mesh ?? undefined,
      // Supplément en centimes : sert à l'affichage (« + 15,00 € ») et au
      // total indicatif du configurateur. Le montant réellement facturé est
      // toujours recalculé côté serveur à l'ajout au panier.
      priceDelta: Math.max(0, Math.round(o.price_delta ?? 0)),
      choices: [...((o.choices as any[]) ?? [])]
        .sort((a, b) => (a.rank ?? 0) - (b.rank ?? 0))
        .map((c) => ({
          id: c.choice_key,
          label: c.label,
          ...(c.color_hex ? { colorHex: c.color_hex } : {}),
          ...(c.texture_path ? { texturePath: c.texture_path } : {}),
          ...(c.darken != null ? { darken: c.darken } : {}),
          priceDelta: Math.max(0, Math.round(c.price_delta ?? 0)),
          isDefault: !!c.is_default,
        })),
    }))

  res.json({
    config: {
      handle: product.handle,
      glbPath: product.glb_path,
      autoRotate: product.auto_rotate,
      modelRotationDeg: product.model_rotation_deg ?? undefined,
      options,
    },
  })
}
