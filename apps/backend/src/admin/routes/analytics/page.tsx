import { defineRouteConfig } from "@medusajs/admin-sdk"
import { ChartBar } from "@medusajs/icons"
import { Container, Heading, Text } from "@medusajs/ui"
import { AnalyticsDashboard } from "../../components/analytics/dashboard"

// ─── Page admin « Statistiques » ──────────────────────────────────────────────
export default function AnalyticsPage() {
  return (
    <Container className="p-0 divide-y divide-ui-border-base">
      <div className="px-6 py-4">
        <Heading>Statistiques</Heading>
        <Text size="small" className="text-ui-fg-muted">
          Commandes, panier moyen et abandon de panier sur la période choisie.
          Tout est calculé à la demande depuis la base Medusa, sans outil externe.
        </Text>
      </div>
      <div className="px-6 py-5">
        <AnalyticsDashboard />
      </div>
    </Container>
  )
}

export const config = defineRouteConfig({
  label: "Statistiques",
  icon: ChartBar,
})
