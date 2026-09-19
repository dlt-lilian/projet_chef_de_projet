import { useCallback, useEffect, useMemo, useState } from "react"
import { Button, Heading, Text, Badge, Label } from "@medusajs/ui"

// ─── Types renvoyés par GET /admin/analytics ──────────────────────────────────
type CurrencyMetrics = {
  currency_code: string
  orders_count: number
  revenue: number
  average_order_value: number | null
  carts_count: number
  carts_completed: number
  abandonment_rate: number | null
}

type AnalyticsResponse = {
  period: { from: string; to: string }
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

const formatMoney = (value: number | null, currency: string): string => {
  if (value == null) return "—"
  try {
    return new Intl.NumberFormat("fr-FR", {
      style: "currency",
      currency: currency.toUpperCase(),
    }).format(value)
  } catch {
    return `${value.toFixed(2)} ${currency.toUpperCase()}`
  }
}

const formatPercent = (value: number | null): string =>
  value == null ? "—" : `${(value * 100).toFixed(1)} %`

const formatDateTime = (iso: string): string =>
  new Date(iso).toLocaleString("fr-FR", {
    dateStyle: "short",
    timeStyle: "short",
  })

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

  return (
    <div className="flex flex-col gap-y-5">
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

      {/* ─── Indicateurs ─────────────────────────────────────────────────── */}
      {!active && !loading && !error ? (
        <Text size="small" className="text-ui-fg-muted">
          Aucune commande ni panier sur cette période.
        </Text>
      ) : null}

      {active ? (
        <>
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
              hint={`${active.carts_completed} commandés sur ${active.carts_count} paniers`}
            />
          </div>

          <div className="flex flex-col items-start gap-y-2">
            <Text size="xsmall" className="text-ui-fg-subtle">
              Un panier compte dans le taux d'abandon dès qu'il contient au moins
              un article. Les paniers créés dans les dernières{" "}
              {data?.abandonment.maturation_hours} h sont exclus : ils peuvent
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
