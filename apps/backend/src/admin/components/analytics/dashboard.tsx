import { useCallback, useEffect, useMemo, useState } from "react"
import { Button, Heading, Text, Badge, Label } from "@medusajs/ui"
import { FunnelChart, type Funnel } from "./funnel-chart"
import { TrendCharts, type SeriesPoint } from "./trend-charts"
import {
  formatBucketLabel,
  formatDateTime,
  formatMoney,
  formatPercent,
  type Granularity,
} from "./format"

// ─── Types renvoyés par GET /admin/analytics ──────────────────────────────────
type CurrencyMetrics = {
  currency_code: string
  orders_count: number
  revenue: number
  average_order_value: number | null
  funnel: Funnel
  abandonment_rate: number | null
  series: SeriesPoint[]
}

type AnalyticsResponse = {
  period: { from: string; to: string; granularity: Granularity }
  abandonment: { cohort_end: string | null; maturation_hours: number }
  by_currency: CurrencyMetrics[]
  totals: { orders_count: number; carts_count: number; carts_completed: number }
  truncated: boolean
}

const INPUT_CLASS =
  "txt-compact-small rounded-md border border-ui-border-base bg-ui-bg-field px-2 py-1.5"

const DAY_MS = 24 * 60 * 60 * 1000

// Les bornes sont calculées dans le fuseau du navigateur puis envoyées en ISO :
// « du 1er au 31 » couvre ainsi les journées françaises, pas les journées UTC.
const toInputValue = (date: Date): string => {
  const month = `${date.getMonth() + 1}`.padStart(2, "0")
  const day = `${date.getDate()}`.padStart(2, "0")
  return `${date.getFullYear()}-${month}-${day}`
}
const startOfLocalDay = (value: string): Date => new Date(`${value}T00:00:00`)
const endOfLocalDay = (value: string): Date =>
  new Date(startOfLocalDay(value).getTime() + DAY_MS)

const PRESETS = [
  { label: "7 jours", days: 7 },
  { label: "30 jours", days: 30 },
  { label: "90 jours", days: 90 },
]

// ─── Tuile d'indicateur ───────────────────────────────────────────────────────
function Metric({
  label,
  value,
  hint,
}: {
  label: string
  value: string
  hint?: string
}) {
  return (
    <div className="flex-1 min-w-[200px] rounded-lg border border-ui-border-base bg-ui-bg-subtle px-4 py-3">
      <Text size="small" className="text-ui-fg-muted">
        {label}
      </Text>
      <Heading level="h1" className="mt-1">
        {value}
      </Heading>
      {hint ? (
        <Text size="xsmall" className="mt-1 text-ui-fg-subtle">
          {hint}
        </Text>
      ) : null}
    </div>
  )
}

// ─── Vue tableau ──────────────────────────────────────────────────────────────
// Contrepartie des courbes : les valeurs exactes, lisibles au lecteur d'écran
// comme à l'impression, sans dépendre du survol.
function SeriesTable({
  series,
  currency,
  granularity,
}: {
  series: SeriesPoint[]
  currency: string
  granularity: Granularity
}) {
  return (
    <div className="max-h-72 overflow-auto rounded-lg border border-ui-border-base">
      <table className="w-full txt-compact-small">
        <thead className="sticky top-0 bg-ui-bg-subtle text-ui-fg-muted">
          <tr>
            <th className="px-3 py-2 text-left font-normal">Période</th>
            <th className="px-3 py-2 text-right font-normal">Commandes</th>
            <th className="px-3 py-2 text-right font-normal">
              Chiffre d'affaires
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-ui-border-base">
          {series.map((point) => (
            <tr key={point.bucket}>
              <td className="px-3 py-1.5 text-ui-fg-subtle">
                {formatBucketLabel(point.bucket, granularity)}
              </td>
              <td className="px-3 py-1.5 text-right text-ui-fg-base">
                {point.orders_count}
              </td>
              <td className="px-3 py-1.5 text-right text-ui-fg-base">
                {formatMoney(point.revenue, currency)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export function AnalyticsDashboard() {
  const today = useMemo(() => new Date(), [])
  const [from, setFrom] = useState(() =>
    toInputValue(new Date(today.getTime() - 29 * DAY_MS))
  )
  const [to, setTo] = useState(() => toInputValue(today))
  const [currency, setCurrency] = useState<string | null>(null)
  const [data, setData] = useState<AnalyticsResponse | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [showTable, setShowTable] = useState(false)

  const applyPreset = (days: number) => {
    const now = new Date()
    setFrom(toInputValue(new Date(now.getTime() - (days - 1) * DAY_MS)))
    setTo(toInputValue(now))
  }

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const params = new URLSearchParams({
        from: startOfLocalDay(from).toISOString(),
        to: endOfLocalDay(to).toISOString(),
        // Découpage de la courbe en journées locales, pas en journées UTC.
        tz_offset: String(new Date().getTimezoneOffset()),
      })
      const res = await fetch(`/admin/analytics?${params}`, {
        credentials: "include",
      })
      const body = await res.json().catch(() => null)
      if (!res.ok) {
        throw new Error(body?.message || "Chargement impossible.")
      }
      setData(body as AnalyticsResponse)
    } catch (e) {
      setError(e instanceof Error ? e.message : "Chargement impossible.")
      setData(null)
    } finally {
      setLoading(false)
    }
  }, [from, to])

  useEffect(() => {
    void load()
  }, [load])

  const rows = data?.by_currency ?? []
  // Devise retenue : celle choisie si elle a des données, sinon la plus active.
  const active =
    rows.find((r) => r.currency_code === currency) ?? rows[0] ?? null
  const otherOrders =
    (data?.totals.orders_count ?? 0) - (active?.orders_count ?? 0)
  const granularity = data?.period.granularity ?? "day"

  return (
    <div className="flex flex-col gap-y-6">
      {/* ─── Période ─────────────────────────────────────────────────────── */}
      <div className="flex flex-wrap items-end gap-3">
        <div className="flex flex-col gap-y-1">
          <Label size="xsmall" htmlFor="analytics-from">
            Du
          </Label>
          <input
            id="analytics-from"
            type="date"
            value={from}
            max={to}
            onChange={(e) => setFrom(e.target.value)}
            className={INPUT_CLASS}
          />
        </div>
        <div className="flex flex-col gap-y-1">
          <Label size="xsmall" htmlFor="analytics-to">
            Au (inclus)
          </Label>
          <input
            id="analytics-to"
            type="date"
            value={to}
            min={from}
            onChange={(e) => setTo(e.target.value)}
            className={INPUT_CLASS}
          />
        </div>
        <div className="flex gap-x-2">
          {PRESETS.map((preset) => (
            <Button
              key={preset.days}
              size="small"
              variant="secondary"
              onClick={() => applyPreset(preset.days)}
            >
              {preset.label}
            </Button>
          ))}
        </div>
        <Button size="small" onClick={() => void load()} isLoading={loading}>
          Actualiser
        </Button>
        {rows.length > 1 ? (
          <div className="flex flex-col gap-y-1">
            <Label size="xsmall" htmlFor="analytics-currency">
              Devise
            </Label>
            <select
              id="analytics-currency"
              value={active?.currency_code ?? ""}
              onChange={(e) => setCurrency(e.target.value)}
              className={INPUT_CLASS}
            >
              {rows.map((row) => (
                <option key={row.currency_code} value={row.currency_code}>
                  {row.currency_code.toUpperCase()}
                </option>
              ))}
            </select>
          </div>
        ) : null}
      </div>

      {error ? (
        <Text size="small" className="text-ui-fg-error">
          {error}
        </Text>
      ) : null}

      {!active && !loading && !error ? (
        <Text size="small" className="text-ui-fg-muted">
          Aucune commande ni panier sur cette période.
        </Text>
      ) : null}

      {active ? (
        <>
          {/* ─── Indicateurs ───────────────────────────────────────────────── */}
          <div className="flex flex-wrap gap-4">
            <Metric
              label="Commandes"
              value={String(active.orders_count)}
              hint={
                otherOrders > 0
                  ? `+ ${otherOrders} dans les autres devises`
                  : "Annulées et brouillons exclus"
              }
            />
            <Metric
              label="Panier moyen"
              value={formatMoney(
                active.average_order_value,
                active.currency_code
              )}
              hint={`Total TTC · ${formatMoney(
                active.revenue,
                active.currency_code
              )} de chiffre d'affaires`}
            />
            <Metric
              label="Abandon de panier"
              value={formatPercent(active.abandonment_rate)}
              hint={`${active.funnel.completed} commandés sur ${active.funnel.with_items} paniers`}
            />
          </div>

          {/* ─── Évolution ─────────────────────────────────────────────────── */}
          <TrendCharts
            series={active.series}
            currency={active.currency_code}
            granularity={granularity}
          />

          <div className="flex flex-col items-start gap-y-2">
            <Button
              size="small"
              variant="transparent"
              onClick={() => setShowTable((value) => !value)}
            >
              {showTable ? "Masquer le tableau" : "Afficher le tableau"}
            </Button>
            {showTable ? (
              <SeriesTable
                series={active.series}
                currency={active.currency_code}
                granularity={granularity}
              />
            ) : null}
          </div>

          {/* ─── Entonnoir ─────────────────────────────────────────────────── */}
          <FunnelChart funnel={active.funnel} />

          {/* ─── Notes de lecture ──────────────────────────────────────────── */}
          <div className="flex flex-col items-start gap-y-2">
            <Text size="xsmall" className="text-ui-fg-subtle">
              Un panier entre dans l'entonnoir dès qu'il contient au moins un
              article. Les paniers créés dans les dernières{" "}
              {data?.abandonment.maturation_hours} h en sont exclus : ils peuvent
              encore être finalisés.
              {data?.abandonment.cohort_end
                ? ` Paniers créés jusqu'au ${formatDateTime(
                    data.abandonment.cohort_end
                  )}.`
                : " Sur cette période, aucun panier n'est encore arrivé à maturité."}
            </Text>
            <Text size="xsmall" className="text-ui-fg-subtle">
              Mesure « ajout au panier → commande ». Elle diffère de l'abandon de
              tunnel suivi dans Google Analytics, qui part de l'entrée en
              paiement.
            </Text>
            {data?.truncated ? (
              <Badge size="2xsmall" color="orange">
                Période trop large : le calcul a été tronqué, réduisez-la.
              </Badge>
            ) : null}
          </div>
        </>
      ) : null}
    </div>
  )
}
