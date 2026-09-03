/**
 * Configure la vue par défaut du tableau /app/orders : masque « Livraison »
 * (fulfillment) et affiche à la place le statut de fabrication.
 *
 * Usage (depuis apps/backend) :
 *   npx medusa exec src/scripts/setup-orders-view.ts
 *
 * Prérequis : `featureFlags.view_configurations` activé dans medusa-config.ts,
 * `npx medusa db:migrate` passé (table + link créés), et au moins une commande
 * portant une étape (cf. backfill-production-status.ts) pour que la colonne
 * soit générée.
 *
 * Le script DÉCOUVRE les colonnes réelles au lieu de les supposer : la
 * génération de colonnes est une fonctionnalité expérimentale, et le nom exact
 * du champ lié dépend de la façon dont Medusa traverse le module graph. Il
 * affiche toujours la liste obtenue — c'est aussi l'outil de diagnostic si le
 * résultat n'est pas celui attendu.
 *
 * Idempotent : une vue système existante est mise à jour, pas dupliquée.
 */

import type { ExecArgs } from "@medusajs/framework/types"
import { Modules } from "@medusajs/framework/utils"

type GeneratedColumn = {
  field: string
  name?: string
  default_visible?: boolean
}

type DiscoverableEntity = { name: string; pluralName?: string }

type SettingsService = {
  listDiscoverableEntities: () => DiscoverableEntity[] | Promise<DiscoverableEntity[]>
  generateEntityColumns: (entityKey: string) => Promise<GeneratedColumn[] | null>
  getSystemDefaultViewConfiguration: (entity: string) => Promise<{ id: string } | null>
  createViewConfigurations: (data: unknown) => Promise<unknown>
  updateViewConfigurations: (id: string, data: unknown) => Promise<unknown>
}

export default async function setupOrdersView({ container }: ExecArgs) {
  let settings: SettingsService
  try {
    settings = container.resolve(Modules.SETTINGS) as unknown as SettingsService
  } catch {
    // Le module settings n'est chargé que si la fonctionnalité est active :
    // c'est le symptôme le plus probable d'un flag oublié.
    console.log(
      "❌ Module « settings » introuvable. Active `featureFlags.view_configurations`\n" +
        "   dans medusa-config.ts, puis relance le serveur avant ce script."
    )
    return
  }


  // ── 1. Retrouver la clé d'entité des commandes ────────────────────────────
  const entities = await settings.listDiscoverableEntities()
  const orderEntity = entities.find(
    (e) => e.name?.toLowerCase() === "order" || e.pluralName === "orders"
  )

  if (!orderEntity) {
    console.log("❌ Entité « order » introuvable parmi les entités découvertes :")
    console.log(entities.map((e) => `   - ${e.name} (${e.pluralName})`).join("\n"))
    return
  }

  // La route HTTP utilise le pluriel ; on tente celui-ci d'abord.
  const candidates = [orderEntity.pluralName, orderEntity.name].filter(
    (v): v is string => !!v
  )

  let entityKey = ""
  let columns: GeneratedColumn[] = []
  for (const candidate of candidates) {
    const generated = await settings.generateEntityColumns(candidate).catch(() => null)
    if (generated?.length) {
      entityKey = candidate
      columns = generated
      break
    }
  }

  if (!columns.length) {
    console.log(
      `❌ Aucune colonne générée pour ${candidates.join(" / ")}. Le flag ` +
        "`view_configurations` est-il bien activé dans medusa-config.ts ?"
    )
    return
  }

  // ── 2. Diagnostic : toujours afficher ce que Medusa propose ───────────────
  console.log(`\n📋 Colonnes disponibles pour « ${entityKey} » :`)
  for (const c of columns) {
    const flag = c.default_visible ? "●" : "○"
    console.log(`   ${flag} ${c.field}${c.name ? `  — ${c.name}` : ""}`)
  }
  console.log("   (● = visible par défaut)\n")

  // ── 3. Repérer nos deux colonnes ──────────────────────────────────────────
  const statusColumn =
    columns.find((c) => c.field === "production_status.label") ??
    columns.find((c) => c.field.startsWith("production_status."))

  const fulfillmentColumn = columns.find((c) =>
    c.field.toLowerCase().includes("fulfillment")
  )

  if (!statusColumn) {
    console.log(
      "❌ Aucune colonne « production_status.* » dans la liste ci-dessus.\n" +
        "   Vérifie que la migration et le link sont passés (npx medusa db:migrate)\n" +
        "   et qu'au moins une commande porte une étape (backfill-production-status.ts)."
    )
    return
  }

  // ── 4. Composer la vue : défauts, moins Livraison, plus le statut ─────────
  const visible = columns
    .filter((c) => c.default_visible)
    .map((c) => c.field)
    .filter((field) => field !== fulfillmentColumn?.field)

  if (!visible.includes(statusColumn.field)) {
    visible.push(statusColumn.field)
  }

  const configuration = {
    visible_columns: visible,
    column_order: visible,
  }

  // ── 5. Créer ou mettre à jour la vue système ──────────────────────────────
  const existing = await settings
    .getSystemDefaultViewConfiguration(entityKey)
    .catch(() => null)

  if (existing?.id) {
    await settings.updateViewConfigurations(existing.id, { configuration })
    console.log("✅ Vue système mise à jour.")
  } else {
    await settings.createViewConfigurations({
      entity: entityKey,
      is_system_default: true,
      configuration,
    })
    console.log("✅ Vue système créée.")
  }

  console.log(`   Colonne ajoutée   : ${statusColumn.field}`)
  console.log(
    `   Colonne masquée   : ${fulfillmentColumn?.field ?? "aucune (« fulfillment » non trouvée)"}`
  )
}
