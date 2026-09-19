import type {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"

/**
 * GET /admin/analytics
 *
 * Trois indicateurs agrégés sur une période : nombre de commandes, panier moyen
 * (total TTC, port et taxes inclus) et taux d'abandon de panier.
 *
 * Paramètres :
 *  - `from` / `to` : instants ISO. `to` est EXCLU. La page admin envoie les
 *    bornes calculées dans le fuseau du navigateur, pour que « le 12 mars »
 *    couvre bien le 12 mars heure française et non heure UTC.
 *  - `maturation_hours` : délai au-delà duquel un panier non finalisé est
 *    considéré comme abandonné (24 h par défaut, cf. plus bas).
 *
 * Périmètre des commandes : les commandes annulées (`status = canceled`) et les
 * brouillons (`is_draft_order`) sont exclus du décompte comme du panier moyen.
 *
 * Les montants ne sont comparables qu'à devise égale : tout est ventilé par
 * `currency_code`, seul le nombre de commandes est aussi donné toutes devises
 * confondues dans `totals`.
 */

const DAY_MS = 24 * 60 * 60 * 1000
const HOUR_MS = 60 * 60 * 1000
const DEFAULT_PERIOD_DAYS = 30
const DEFAULT_MATURATION_HOURS = 24
const ORDERS_PAGE_SIZE = 1000
// Garde-fou mémoire : au-delà, la réponse est marquée `truncated`.
const ORDERS_MAX = 50_000

type CurrencyMetrics = {
  currency_code: string
  orders_count: number
  revenue: number
  average_order_value: number | null
  carts_count: number
  carts_completed: number
  abandonment_rate: number | null
}

const parseDate = (value: unknown): Date | null => {
  if (typeof value !== "string" || !value.trim()) return null
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? null : date
}

const round = (value: number, decimals: number): number => {
  const factor = 10 ** decimals
  return Math.round(value * factor) / factor
}

/**
 * Les totaux du module Order sont des `BigNumber` : `Number()` passe par leur
 * `valueOf()`. On retombe sur `.value` si jamais la sérialisation renvoie la
 * forme brute `{ value: "12.34" }`.
 */
const toAmount = (value: unknown): number => {
  if (value == null) return 0
  const direct = Number(value)
  if (Number.isFinite(direct)) return direct
  const raw = (value as { value?: unknown }).value
  const fallback = Number(raw)
  return Number.isFinite(fallback) ? fallback : 0
}

export const GET = async (
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse
) => {
  const params = req.query as Record<string, unknown>

  const to = parseDate(params.to) ?? new Date()
  const from =
    parseDate(params.from) ??
    new Date(to.getTime() - DEFAULT_PERIOD_DAYS * DAY_MS)

  if (from.getTime() >= to.getTime()) {
    return res
      .status(400)
      .json({ message: "La date de début doit précéder la date de fin." })
  }

  const maturationHours = Number(params.maturation_hours)
  const maturationMs =
    (Number.isFinite(maturationHours) && maturationHours >= 0
      ? maturationHours
      : DEFAULT_MATURATION_HOURS) * HOUR_MS

  // Un panier créé il y a dix minutes n'est pas abandonné, il est en cours : la
  // cohorte s'arrête `maturation_hours` avant maintenant, sinon le taux est
  // mécaniquement gonflé sur les périodes récentes.
  const cohortEnd = new Date(Math.min(to.getTime(), Date.now() - maturationMs))
  const cohortIsEmpty = cohortEnd.getTime() <= from.getTime()

  const metrics = new Map<string, CurrencyMetrics>()
  const bucket = (currencyCode: string): CurrencyMetrics => {
    let entry = metrics.get(currencyCode)
    if (!entry) {
      entry = {
        currency_code: currencyCode,
        orders_count: 0,
        revenue: 0,
        average_order_value: null,
        carts_count: 0,
        carts_completed: 0,
        abandonment_rate: null,
      }
      metrics.set(currencyCode, entry)
    }
    return entry
  }

  // ─── Commandes ──────────────────────────────────────────────────────────────
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)
  let skip = 0
  let truncated = false

  for (;;) {
    const { data } = await query.graph({
      entity: "order",
      // Demander `total` fait charger par le module les lignes, taxes et frais
      // de port nécessaires à son calcul : inutile d'aller les chercher soi-même.
      fields: ["id", "currency_code", "total", "status", "canceled_at"],
      filters: {
        created_at: { $gte: from.toISOString(), $lt: to.toISOString() },
        is_draft_order: false,
      },
      pagination: { skip, take: ORDERS_PAGE_SIZE, order: { id: "ASC" } },
    })

    const rows = data ?? []

    for (const order of rows) {
      if (order.status === "canceled" || order.canceled_at) continue
      const entry = bucket(String(order.currency_code ?? "").toLowerCase())
      entry.orders_count += 1
      entry.revenue += toAmount(order.total)
    }

    skip += rows.length
    if (rows.length < ORDERS_PAGE_SIZE) break
    if (skip >= ORDERS_MAX) {
      truncated = true
      break
    }
  }

  // ─── Paniers ────────────────────────────────────────────────────────────────
  // Agrégation en SQL : inutile de rapatrier des milliers de paniers pour n'en
  // compter que deux colonnes. Un panier sans ligne (création puis échec de
  // l'ajout) n'a jamais été un panier : il est hors dénominateur.
  if (!cohortIsEmpty) {
    const pg = req.scope.resolve(ContainerRegistrationKeys.PG_CONNECTION)
    const { rows } = await pg.raw(
      `select
         c.currency_code,
         count(*)::int as carts,
         count(*) filter (where c.completed_at is not null)::int as completed
       from cart c
       where c.deleted_at is null
         and c.created_at >= ?
         and c.created_at < ?
         and exists (
           select 1 from cart_line_item li
           where li.cart_id = c.id and li.deleted_at is null
         )
       group by c.currency_code`,
      [from.toISOString(), cohortEnd.toISOString()]
    )

    for (const row of rows ?? []) {
      const entry = bucket(String(row.currency_code ?? "").toLowerCase())
      entry.carts_count = Number(row.carts) || 0
      entry.carts_completed = Number(row.completed) || 0
    }
  }

  const byCurrency = [...metrics.values()]
    .map((entry) => ({
      ...entry,
      revenue: round(entry.revenue, 2),
      average_order_value: entry.orders_count
        ? round(entry.revenue / entry.orders_count, 2)
        : null,
      abandonment_rate: entry.carts_count
        ? round(1 - entry.carts_completed / entry.carts_count, 4)
        : null,
    }))
    .sort((a, b) => b.orders_count - a.orders_count)

  res.json({
    period: { from: from.toISOString(), to: to.toISOString() },
    // Fin de la cohorte de paniers, toujours <= `to` : à afficher pour que le
    // taux d'abandon ne soit pas lu comme couvrant la période entière.
    abandonment: {
      cohort_end: cohortIsEmpty ? null : cohortEnd.toISOString(),
      maturation_hours: maturationMs / HOUR_MS,
    },
    by_currency: byCurrency,
    totals: {
      orders_count: byCurrency.reduce((sum, e) => sum + e.orders_count, 0),
      carts_count: byCurrency.reduce((sum, e) => sum + e.carts_count, 0),
      carts_completed: byCurrency.reduce((sum, e) => sum + e.carts_completed, 0),
    },
    truncated,
  })
}
