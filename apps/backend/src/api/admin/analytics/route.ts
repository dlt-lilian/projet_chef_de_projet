import type {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"

/**
 * GET /admin/analytics
 *
 * Indicateurs agrégés sur une période : nombre de commandes, panier moyen
 * (total TTC, port et taxes inclus), entonnoir panier → commande, et série
 * temporelle du chiffre d'affaires et des commandes.
 *
 * Paramètres :
 *  - `from` / `to` : instants ISO. `to` est EXCLU. La page admin envoie les
 *    bornes calculées dans le fuseau du navigateur, pour que « le 12 mars »
 *    couvre bien le 12 mars heure française et non heure UTC.
 *  - `tz_offset` : `Date.getTimezoneOffset()` du navigateur, en minutes. Sert à
 *    découper la série en journées locales. Un décalage unique est appliqué à
 *    toute la période : sur une plage à cheval sur un changement d'heure, une
 *    moitié est décalée d'une heure — sans effet visible à la maille jour.
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
const MINUTE_MS = 60 * 1000
const DEFAULT_PERIOD_DAYS = 30
const DEFAULT_MATURATION_HOURS = 24
const ORDERS_PAGE_SIZE = 1000
// Garde-fou mémoire : au-delà, la réponse est marquée `truncated`.
const ORDERS_MAX = 50_000
// Au-delà de ce nombre de jours la série passe à la maille semaine : une courbe
// de 400 points quotidiens n'est plus lisible.
const DAILY_MAX_DAYS = 92
// Garde-fou de boucle sur des périodes absurdes (~19 ans en semaines).
const BUCKETS_MAX = 1000

type Granularity = "day" | "week"

type SeriesPoint = {
  bucket: string
  orders_count: number
  revenue: number
}

type Funnel = {
  with_items: number
  with_contact: number
  with_shipping: number
  completed: number
}

type CurrencyMetrics = {
  currency_code: string
  orders_count: number
  revenue: number
  average_order_value: number | null
  funnel: Funnel
  abandonment_rate: number | null
  series: SeriesPoint[]
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

/**
 * Découpage de la série. Le décalage du navigateur est retranché à l'instant
 * UTC : l'heure murale locale est alors manipulable comme de l'UTC, et la clé
 * du seau est simplement sa date ISO. En maille semaine, le seau est le lundi.
 */
const makeBucketKey =
  (tzOffsetMs: number, granularity: Granularity) =>
  (instant: number): string => {
    const local = new Date(instant - tzOffsetMs)
    local.setUTCHours(0, 0, 0, 0)
    if (granularity === "week") {
      const mondayIndex = (local.getUTCDay() + 6) % 7
      local.setUTCDate(local.getUTCDate() - mondayIndex)
    }
    return local.toISOString().slice(0, 10)
  }

/** Seaux vides compris : une journée sans commande vaut 0, pas un trou. */
const enumerateBuckets = (
  from: Date,
  to: Date,
  tzOffsetMs: number,
  granularity: Granularity
): string[] => {
  const keyOf = makeBucketKey(tzOffsetMs, granularity)
  const step = granularity === "week" ? 7 * DAY_MS : DAY_MS
  const buckets: string[] = []

  // On avance sur la timeline locale, puis on reconvertit pour comparer à `to`.
  let cursor = new Date(`${keyOf(from.getTime())}T00:00:00.000Z`).getTime()
  const end = to.getTime() - tzOffsetMs

  while (cursor < end && buckets.length < BUCKETS_MAX) {
    buckets.push(new Date(cursor).toISOString().slice(0, 10))
    cursor += step
  }

  return buckets
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

  const tzOffsetRaw = Number(params.tz_offset)
  // `getTimezoneOffset()` tient dans ±16 h ; au-delà, l'entrée est ignorée.
  const tzOffsetMs =
    Number.isFinite(tzOffsetRaw) && Math.abs(tzOffsetRaw) <= 16 * 60
      ? tzOffsetRaw * MINUTE_MS
      : 0

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

  const spanDays = (to.getTime() - from.getTime()) / DAY_MS
  const granularity: Granularity = spanDays > DAILY_MAX_DAYS ? "week" : "day"
  const bucketKeys = enumerateBuckets(from, to, tzOffsetMs, granularity)
  const bucketKeyOf = makeBucketKey(tzOffsetMs, granularity)

  const metrics = new Map<string, CurrencyMetrics>()
  const series = new Map<string, Map<string, SeriesPoint>>()

  const entryFor = (currencyCode: string): CurrencyMetrics => {
    let entry = metrics.get(currencyCode)
    if (!entry) {
      entry = {
        currency_code: currencyCode,
        orders_count: 0,
        revenue: 0,
        average_order_value: null,
        funnel: {
          with_items: 0,
          with_contact: 0,
          with_shipping: 0,
          completed: 0,
        },
        abandonment_rate: null,
        series: [],
      }
      metrics.set(currencyCode, entry)
      series.set(
        currencyCode,
        new Map(
          bucketKeys.map((bucket) => [
            bucket,
            { bucket, orders_count: 0, revenue: 0 },
          ])
        )
      )
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
      fields: [
        "id",
        "currency_code",
        "total",
        "status",
        "canceled_at",
        "created_at",
      ],
      filters: {
        created_at: { $gte: from.toISOString(), $lt: to.toISOString() },
        is_draft_order: false,
      },
      pagination: { skip, take: ORDERS_PAGE_SIZE, order: { id: "ASC" } },
    })

    const rows = data ?? []

    for (const order of rows) {
      if (order.status === "canceled" || order.canceled_at) continue

      const currencyCode = String(order.currency_code ?? "").toLowerCase()
      const entry = entryFor(currencyCode)
      const amount = toAmount(order.total)

      entry.orders_count += 1
      entry.revenue += amount

      const createdAt = new Date(order.created_at as string).getTime()
      if (!Number.isNaN(createdAt)) {
        const point = series.get(currencyCode)?.get(bucketKeyOf(createdAt))
        // Pas de seau : commande en bordure de période, elle compte dans les
        // totaux mais pas dans la courbe.
        if (point) {
          point.orders_count += 1
          point.revenue += amount
        }
      }
    }

    skip += rows.length
    if (rows.length < ORDERS_PAGE_SIZE) break
    if (skip >= ORDERS_MAX) {
      truncated = true
      break
    }
  }

  // ─── Entonnoir panier → commande ────────────────────────────────────────────
  // Agrégation en SQL : inutile de rapatrier des milliers de paniers pour n'en
  // compter que quatre colonnes. Un panier sans ligne (création puis échec de
  // l'ajout) n'a jamais été un panier : il est hors dénominateur.
  //
  // Chaque étape inclut les suivantes (`or` en cascade) : l'entonnoir décroît
  // donc toujours, même si un panier a sauté une étape en base.
  if (!cohortIsEmpty) {
    const pg = req.scope.resolve(ContainerRegistrationKeys.PG_CONNECTION)
    const { rows } = await pg.raw(
      `select
         c.currency_code,
         count(*)::int as with_items,
         count(*) filter (
           where c.email is not null
              or c.shipping_address_id is not null
              or sm.present
              or c.completed_at is not null
         )::int as with_contact,
         count(*) filter (
           where sm.present or c.completed_at is not null
         )::int as with_shipping,
         count(*) filter (where c.completed_at is not null)::int as completed
       from cart c
       left join lateral (
         select true as present
         from cart_shipping_method m
         where m.cart_id = c.id and m.deleted_at is null
         limit 1
       ) sm on true
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
      const entry = entryFor(String(row.currency_code ?? "").toLowerCase())
      entry.funnel = {
        with_items: Number(row.with_items) || 0,
        with_contact: Number(row.with_contact) || 0,
        with_shipping: Number(row.with_shipping) || 0,
        completed: Number(row.completed) || 0,
      }
    }
  }

  const byCurrency = [...metrics.values()]
    .map((entry) => ({
      ...entry,
      revenue: round(entry.revenue, 2),
      average_order_value: entry.orders_count
        ? round(entry.revenue / entry.orders_count, 2)
        : null,
      abandonment_rate: entry.funnel.with_items
        ? round(1 - entry.funnel.completed / entry.funnel.with_items, 4)
        : null,
      series: bucketKeys.map((bucket) => {
        const point = series.get(entry.currency_code)?.get(bucket)
        return {
          bucket,
          orders_count: point?.orders_count ?? 0,
          revenue: round(point?.revenue ?? 0, 2),
        }
      }),
    }))
    .sort((a, b) => b.orders_count - a.orders_count)

  res.json({
    period: { from: from.toISOString(), to: to.toISOString(), granularity },
    // Fin de la cohorte de paniers, toujours <= `to` : à afficher pour que le
    // taux d'abandon ne soit pas lu comme couvrant la période entière.
    abandonment: {
      cohort_end: cohortIsEmpty ? null : cohortEnd.toISOString(),
      maturation_hours: maturationMs / HOUR_MS,
    },
    by_currency: byCurrency,
    totals: {
      orders_count: byCurrency.reduce((sum, e) => sum + e.orders_count, 0),
      carts_count: byCurrency.reduce(
        (sum, e) => sum + e.funnel.with_items,
        0
      ),
      carts_completed: byCurrency.reduce(
        (sum, e) => sum + e.funnel.completed,
        0
      ),
    },
    truncated,
  })
}
