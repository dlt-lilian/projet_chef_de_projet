import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import {
  ContainerRegistrationKeys,
  QueryContext,
} from "@medusajs/framework/utils"
import { addToCartWorkflow } from "@medusajs/medusa/core-flows"
import { CONFIGURATOR_MODULE } from "../../../../../modules/configurator"
import type ConfiguratorModuleService from "../../../../../modules/configurator/service"
import {
  buildLineMetadata,
  centsToAmount,
  computeSurcharge,
  CONFIGURATOR_META,
  type ConfiguratorSelections,
} from "../../../../../modules/configurator/price"

/**
 * POST /store/carts/:id/configurator-line-items
 *
 * Ajoute au panier un article personnalisé dans le configurateur 3D, au prix de
 * la variante MAJORÉ des suppléments des options choisies.
 *
 * Body : { variant_id, quantity?, handle, selections: { [option_key]: choice_key },
 *          engraving? }
 *
 * Le client n'envoie QUE des identifiants : les libellés, les suppléments et le
 * prix final sont relus en base ici. Une route qui accepterait un prix depuis le
 * navigateur laisserait n'importe qui commander à 0 €.
 *
 * Le prix est posé via `unit_price` sur `addToCartWorkflow`, ce qui marque la
 * ligne `is_custom_price`. Le recalcul du panier (adresse, livraison, promo,
 * validation de commande) préserve alors ce montant au lieu de le réécrire avec
 * le tarif catalogue de la variante.
 */
export const POST = async (req: MedusaRequest, res: MedusaResponse) => {
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)
  const svc: ConfiguratorModuleService = req.scope.resolve(CONFIGURATOR_MODULE)

  const { id: cartId } = req.params as { id: string }
  const body = (req.body ?? {}) as Record<string, unknown>

  const variantId = typeof body.variant_id === "string" ? body.variant_id : ""
  const handle = typeof body.handle === "string" ? body.handle : ""
  if (!variantId || !handle) {
    return res
      .status(400)
      .json({ message: "variant_id et handle sont obligatoires." })
  }

  const quantity = Math.max(1, Math.floor(Number(body.quantity) || 1))
  const engraving = typeof body.engraving === "string" ? body.engraving : ""

  // Ne garde que les paires de chaînes : un objet exotique ne doit pas traverser
  // jusqu'au calcul ni jusqu'au metadata.
  const selections: ConfiguratorSelections = {}
  if (body.selections && typeof body.selections === "object") {
    for (const [key, value] of Object.entries(
      body.selections as Record<string, unknown>
    )) {
      if (typeof value === "string" && value) selections[key] = value
    }
  }

  // ── Panier : région et devise pilotent le prix de la variante ──────────────
  const { data: carts } = await query.graph({
    entity: "cart",
    fields: ["id", "region_id", "currency_code"],
    filters: { id: cartId },
  })
  const cart = carts?.[0]
  if (!cart) {
    return res.status(404).json({ message: `Panier "${cartId}" introuvable.` })
  }

  // ── Configuration du produit ──────────────────────────────────────────────
  const product = await svc.getConfigByHandle(handle)
  if (!product) {
    return res
      .status(404)
      .json({ message: `Configuration introuvable pour "${handle}".` })
  }

  // ── Variante : prix catalogue dans le contexte du panier ───────────────────
  const { data: variants } = await query.graph({
    entity: "variant",
    fields: ["id", "product.handle", "calculated_price.*"],
    filters: { id: variantId },
    context: {
      calculated_price: QueryContext({
        region_id: cart.region_id,
        currency_code: cart.currency_code,
      }),
    },
  })
  // `calculated_price` est injecté par le QueryContext ci-dessus : il n'est pas
  // dans le type statique de la variante, d'où l'annotation explicite.
  const variant = variants?.[0] as
    | {
        product?: { handle?: string } | null
        calculated_price?: { calculated_amount?: number } | null
      }
    | undefined
  if (!variant) {
    return res
      .status(404)
      .json({ message: `Variante "${variantId}" introuvable.` })
  }
  // La variante doit bien appartenir au produit configuré : sinon la
  // configuration (et ses suppléments) ne correspondrait pas à l'article vendu.
  if (variant.product?.handle && variant.product.handle !== handle) {
    return res.status(400).json({
      message: `La variante ne correspond pas au produit "${handle}".`,
    })
  }

  const basePrice = variant.calculated_price?.calculated_amount
  if (typeof basePrice !== "number") {
    return res.status(400).json({
      message: `Aucun prix pour la variante "${variantId}" dans cette région.`,
    })
  }

  // ── Supplément recalculé depuis la base ───────────────────────────────────
  const surcharge = computeSurcharge(
    (product.options as any[]) ?? [],
    selections,
    engraving
  )
  const metadata = buildLineMetadata(handle, selections, engraving, surcharge)
  // Addition faite en centimes puis reconvertie : `25.5 + 12.9` en flottant
  // donnerait 38.400000000000006, qui partirait tel quel en base.
  const unitPrice = centsToAmount(
    Math.round(basePrice * 100) + surcharge.totalCents
  )

  await addToCartWorkflow(req.scope).run({
    input: {
      cart_id: cartId,
      items: [
        { variant_id: variantId, quantity, unit_price: unitPrice, metadata },
      ],
    },
  })

  // Renvoie la ligne créée pour que la fiche produit puisse s'y épingler
  // (`?line=<id>`). On la retrouve par variante + résumé de config, déterministe.
  const { data: refreshed } = await query.graph({
    entity: "cart",
    fields: ["id", "items.id", "items.variant_id", "items.metadata"],
    filters: { id: cartId },
  })
  const summary = metadata[CONFIGURATOR_META.summary]
  const line = (refreshed?.[0]?.items ?? []).find(
    (item) =>
      item?.variant_id === variantId &&
      (item?.metadata as Record<string, unknown> | null | undefined)?.[
        CONFIGURATOR_META.summary
      ] === summary
  )

  res.status(200).json({
    line_id: line?.id ?? null,
    unit_price: unitPrice,
    surcharge_cents: surcharge.totalCents,
  })
}
