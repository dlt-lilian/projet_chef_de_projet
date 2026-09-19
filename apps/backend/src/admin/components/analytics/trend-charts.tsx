import { Heading, Text } from "@medusajs/ui"
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts"
import { useChartTheme, type ChartTheme } from "./chart-theme"
import {
  formatBucketLabel,
  formatBucketTick,
  formatCompactMoney,
  formatMoney,
  type Granularity,
} from "./format"

export type SeriesPoint = {
  bucket: string
  orders_count: number
  revenue: number
}

/**
 * Deux graphiques empilés plutôt qu'un seul à deux axes.
 *
 * Un euro et une commande n'ont pas la même échelle : superposer les deux
 * courbes sur un graphique à double ordonnée ferait naître une corrélation qui
 * n'existe pas, l'alignement des deux axes étant arbitraire. Les deux panneaux
 * partagent le même axe des dates, la lecture croisée se fait à la verticale.
 */

const CHART_HEIGHT = 180
const AXIS_FONT_SIZE = 11

// ─── Infobulle ────────────────────────────────────────────────────────────────
// Toujours présente : un graphique sans survol oblige à lire les valeurs à vue
// d'œil sur l'axe.
function ChartTooltip({
  active,
  payload,
  label,
  granularity,
  render,
}: {
  active?: boolean
  payload?: { value?: number | string }[]
  label?: string
  granularity: Granularity
  render: (value: number) => string
}) {
  if (!active || !payload?.length || typeof label !== "string") return null
  const value = Number(payload[0]?.value ?? 0)

  return (
    <div className="rounded-lg border border-ui-border-base bg-ui-bg-base px-3 py-2 shadow-elevation-tooltip">
      <Text size="xsmall" className="text-ui-fg-subtle">
        {formatBucketLabel(label, granularity)}
      </Text>
      <Text size="small" weight="plus" className="text-ui-fg-base">
        {render(value)}
      </Text>
    </div>
  )
}

// ─── Axes partagés ────────────────────────────────────────────────────────────
const axisProps = (theme: ChartTheme) => ({
  stroke: theme.grid,
  tick: { fill: theme.axis, fontSize: AXIS_FONT_SIZE },
  tickLine: false,
  axisLine: false,
})

function EmptyPlot({ height }: { height: number }) {
  return (
    <div
      className="flex items-center justify-center rounded-lg border border-dashed border-ui-border-base"
      style={{ height }}
    >
      <Text size="small" className="text-ui-fg-muted">
        Aucune donnée sur cette période.
      </Text>
    </div>
  )
}

function Panel({
  title,
  subtitle,
  children,
}: {
  title: string
  subtitle: string
  children: React.ReactNode
}) {
  return (
    <div className="flex flex-col gap-y-2">
      <div>
        <Heading level="h3">{title}</Heading>
        <Text size="xsmall" className="text-ui-fg-muted">
          {subtitle}
        </Text>
      </div>
      {children}
    </div>
  )
}

export function TrendCharts({
  series,
  currency,
  granularity,
}: {
  series: SeriesPoint[]
  currency: string
  granularity: Granularity
}) {
  const theme = useChartTheme()
  const step = granularity === "week" ? "semaine" : "jour"

  if (!series.length) {
    return (
      <div className="flex flex-col gap-y-6">
        <Panel title="Chiffre d'affaires" subtitle={`Par ${step}, total TTC`}>
          <EmptyPlot height={CHART_HEIGHT} />
        </Panel>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-y-6">
      <Panel title="Chiffre d'affaires" subtitle={`Par ${step}, total TTC`}>
        <ResponsiveContainer width="100%" height={CHART_HEIGHT}>
          <AreaChart
            data={series}
            margin={{ top: 4, right: 8, bottom: 0, left: 0 }}
          >
            {/* Grille horizontale seulement : les verticales n'aident pas à
                comparer des hauteurs et alourdissent le fond. */}
            <CartesianGrid
              vertical={false}
              stroke={theme.grid}
              strokeDasharray="3 3"
            />
            <XAxis
              dataKey="bucket"
              tickFormatter={formatBucketTick}
              minTickGap={28}
              {...axisProps(theme)}
            />
            <YAxis
              width={64}
              tickFormatter={(value: number) =>
                formatCompactMoney(value, currency)
              }
              {...axisProps(theme)}
            />
            <Tooltip
              cursor={{ stroke: theme.axis, strokeWidth: 1 }}
              content={
                <ChartTooltip
                  granularity={granularity}
                  render={(value) => formatMoney(value, currency)}
                />
              }
            />
            <Area
              type="monotone"
              dataKey="revenue"
              stroke={theme.accent}
              strokeWidth={2}
              fill={theme.accentSoft}
              dot={false}
              activeDot={{ r: 4, strokeWidth: 2 }}
              // Un tableau de bord n'a rien à animer : la montée des courbes
              // n'apporte rien et laisse un graphique vide pendant une seconde.
              isAnimationActive={false}
            />
          </AreaChart>
        </ResponsiveContainer>
      </Panel>

      <Panel
        title="Commandes"
        subtitle={`Par ${step}, annulées et brouillons exclus`}
      >
        <ResponsiveContainer width="100%" height={CHART_HEIGHT}>
          <BarChart
            data={series}
            margin={{ top: 4, right: 8, bottom: 0, left: 0 }}
          >
            <CartesianGrid
              vertical={false}
              stroke={theme.grid}
              strokeDasharray="3 3"
            />
            <XAxis
              dataKey="bucket"
              tickFormatter={formatBucketTick}
              minTickGap={28}
              {...axisProps(theme)}
            />
            <YAxis
              width={40}
              allowDecimals={false}
              {...axisProps(theme)}
            />
            <Tooltip
              cursor={{ fill: theme.track }}
              content={
                <ChartTooltip
                  granularity={granularity}
                  render={(value) =>
                    `${value} commande${value > 1 ? "s" : ""}`
                  }
                />
              }
            />
            <Bar
              dataKey="orders_count"
              fill={theme.accent}
              radius={[4, 4, 0, 0]}
              maxBarSize={28}
              isAnimationActive={false}
            />
          </BarChart>
        </ResponsiveContainer>
      </Panel>
    </div>
  )
}
