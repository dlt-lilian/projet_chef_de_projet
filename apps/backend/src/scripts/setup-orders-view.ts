/**
 * Configure le tableau /app/orders :
 *   1. francise les en-têtes de colonnes ;
 *   2. met le statut de fabrication à la place de « Livraison ».
 *
 * Usage (depuis apps/backend) :
 *   npx medusa exec src/scripts/setup-orders-view.ts
 *
 * Prérequis : `featureFlags.view_configurations` activé dans medusa-config.ts,
 * `npx medusa db:migrate` passé (table + link créés), et au moins une commande
 * portant une étape (cf. backfill-production-status.ts) pour que la colonne
 * soit générée.
 *
 * Pourquoi des libellés en base : avec le flag `view_configurations`, le tableau
 * n'est plus la table écrite à la main du dashboard (traduite, avec ses
 * renderers) mais une table générée depuis le module graph. Ses en-têtes sont
 * calculés côté serveur — `display_id` donne « Display Id » — sans passer par
 * i18n. Le seul point d'entrée est le modèle `property_label` du module
 * settings, que le générateur consulte avant de fabriquer un nom :
 * `label ?? formatFieldName(champ)`. D'où la table de correspondance ci-dessous.
 *
 * Ces libellés ne portent que sur les EN-TÊTES. Les cellules affichent toujours
 * la valeur brute de la base (« authorized » pour le paiement) : c'est pour ça
 * que le modèle production_status stocke un `label` déjà traduit.
 *
 * Le script DÉCOUVRE les colonnes réelles au lieu de les supposer : la
 * génération de colonnes est une fonctionnalité expérimentale, et le nom exact
 * du champ lié dépend de la façon dont Medusa traverse le module graph. Il
 * affiche toujours la liste obtenue — c'est aussi l'outil de diagnostic si le
 * résultat n'est pas celui attendu.
 *
 * Idempotent : un libellé déjà correct n'est pas réécrit, une vue système
 * existante est mise à jour et non dupliquée.
 */

import type { ExecArgs } from "@medusajs/framework/types"
import { Modules } from "@medusajs/framework/utils"

type GeneratedColumn = {
  field: string
  name?: string
  default_visible?: boolean
}

type DiscoverableEntity = { name: string; pluralName?: string }

type PropertyLabel = {
  id: string
  entity: string
  property: string
  label: string
}

type SettingsService = {
  listDiscoverableEntities: () => DiscoverableEntity[] | Promise<DiscoverableEntity[]>
  generateEntityColumns: (entityKey: string) => Promise<GeneratedColumn[] | null>
  getSystemDefaultViewConfiguration: (entity: string) => Promise<{ id: string } | null>
  createViewConfigurations: (data: unknown) => Promise<unknown>
  updateViewConfigurations: (id: string, data: unknown) => Promise<unknown>
  listPropertyLabels: (filters?: Record<string, unknown>) => Promise<PropertyLabel[]>
  upsertPropertyLabels: (
    data: Array<Partial<PropertyLabel>>
  ) => Promise<PropertyLabel[]>
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

  // ── 4. Franciser les en-têtes ─────────────────────────────────────────────
  // Les libellés sont indexés par chemin complet du champ, exactement comme les
  // colonnes générées. Table à étendre au fil des colonnes affichées : le
  // script liste plus bas celles qui n'en ont pas encore.
  const wanted = new Map<string, string>([
    ["display_id", "N° commande"],
    ["created_at", "Date"],
    ["customer_display", "Client"],
    ["sales_channel.name", "Canal de vente"],
    ["payment_status", "Paiement"],
    ["fulfillment_status", "Livraison"],
    ["total", "Total"],
    ["country", "Pays"],
    [statusColumn.field, "État de la commande"],
  ])

  const generatedFields = new Set(columns.map((c) => c.field))
  const existingLabels = await settings.listPropertyLabels({
    entity: orderEntity.name,
  })
  const labelByProperty = new Map<string, PropertyLabel>()
  for (const row of existingLabels) {
    labelByProperty.set(row.property, row)
  }

  const toWrite: Array<Partial<PropertyLabel>> = []
  const unknownFields: string[] = []

  for (const [property, label] of wanted) {
    if (!generatedFields.has(property)) {
      // Poser un libellé sur un champ qui n'existe pas laisserait une ligne
      // morte en base, invisible depuis l'admin.
      unknownFields.push(property)
      continue
    }

    const current = labelByProperty.get(property)
    if (current?.label === label) {
      continue
    }

    toWrite.push({
      // `upsert` ne reconnaît une ligne existante qu'à son id : sans lui, un
      // second passage créerait un doublon, et le générateur en prendrait un au
      // hasard.
      ...(current ? { id: current.id } : {}),
      entity: orderEntity.name,
      property,
      label,
    })
  }

  if (toWrite.length) {
    await settings.upsertPropertyLabels(toWrite)
  }

  const untouched = wanted.size - toWrite.length - unknownFields.length
  console.log(
    `🏷️  Libellés : ${toWrite.length} écrit(s), ${untouched} déjà à jour.`
  )
  if (unknownFields.length) {
    console.log(`   Champs inconnus, ignorés : ${unknownFields.join(", ")}`)
  }

  const unlabelled = columns
    .map((c) => c.field)
    .filter((field) => !wanted.has(field) && !labelByProperty.has(field))
  if (unlabelled.length) {
    console.log(
      "   Sans libellé FR (en-tête anglais si tu les affiches) :\n" +
        `   ${unlabelled.join(", ")}`
    )
  }

  // ── 5. Composer la vue : le statut prend la PLACE de « Livraison » ────────
  // Remplacement sur place plutôt qu'ajout en fin de liste : la colonne d'état
  // doit rester à hauteur d'œil, pas se perdre derrière « Pays ».
  const ordered: string[] = []
  for (const column of columns) {
    if (!column.default_visible || column.field === statusColumn.field) {
      continue
    }
    if (column.field === fulfillmentColumn?.field) {
      ordered.push(statusColumn.field)
      continue
    }
    ordered.push(column.field)
  }

  if (!ordered.includes(statusColumn.field)) {
    ordered.push(statusColumn.field)
  }

  const configuration = {
    visible_columns: ordered,
    column_order: ordered,
  }

  // ── 6. Créer ou mettre à jour la vue système ──────────────────────────────
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

  console.log(`   Colonnes visibles : ${ordered.join(", ")}`)
  console.log(
    `   Colonne masquée   : ${fulfillmentColumn?.field ?? "aucune (« fulfillment » non trouvée)"}`
  )
}
