import { MedusaContainer } from "@medusajs/framework";
import {
  ContainerRegistrationKeys,
  ProductStatus,
} from "@medusajs/framework/utils";
import {
  createProductsWorkflow,
  deleteProductsWorkflow,
} from "@medusajs/medusa/core-flows";

// ──────────────────────────────────────────────────────────────────────
// Seed des produits du configurator 3D.
// Handles alignés sur CONFIGURABLE_HANDLES du storefront :
//   chopsticks · eventail · parapluie
//
// Remplace l'ancien seed (handles baguettes-japonaises / pack-kogei) :
//   1. supprime les anciens produits orphelins (try/catch — non bloquant)
//   2. crée les nouveaux produits (idempotent)
//
// Nouveau NOM de fichier volontaire : un migration-script est tracké par
// nom dans script_migrations ; renommer force la ré-exécution.
// ──────────────────────────────────────────────────────────────────────

const OLD_HANDLES = [
  "baguettes-japonaises",
  "eventail-japonais",
  "parapluie-japonais",
  "pack-kogei",
];

const KOGEI_PRODUCTS = [
  {
    handle: "chopsticks",
    title: "Baguettes Japonaises",
    description:
      "Baguettes japonaises en bois, personnalisables : essence de bois et gravure. Façonnées dans la tradition Kōgei.",
    price: 25,
  },
  {
    handle: "eventail",
    title: "Éventail Japonais",
    description:
      "Éventail japonais (sensu) personnalisable : tissu et motif. Élégance et savoir-faire artisanal.",
    price: 35,
  },
  {
    handle: "parapluie",
    title: "Parapluie Japonais",
    description:
      "Parapluie japonais (wagasa) personnalisable. Pièce d'exception inspirée de l'artisanat traditionnel.",
    price: 45,
  },
];

export default async function seed_configurator_products({
  container,
}: {
  container: MedusaContainer;
}) {
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER);
  const query = container.resolve(ContainerRegistrationKeys.QUERY);

  // 1. Supprime les anciens produits orphelins (ancien système 3D).
  //    Non bloquant : un échec ici ne doit pas empêcher la création.
  try {
    const { data: allProducts } = await query.graph({
      entity: "product",
      fields: ["id", "handle"],
    });
    const toDelete = allProducts.filter((p) => OLD_HANDLES.includes(p.handle));
    if (toDelete.length > 0) {
      logger.info(
        `Configurator seed: suppression de ${toDelete.length} ancien(s) produit(s) orphelin(s)...`
      );
      await deleteProductsWorkflow(container).run({
        input: { ids: toDelete.map((p) => p.id) },
      });
    }
  } catch (e) {
    logger.warn(
      `Configurator seed: suppression des anciens produits ignorée (${
        e instanceof Error ? e.message : "erreur inconnue"
      }).`
    );
  }

  // 2. Sales channel par défaut + shipping profile
  const { data: salesChannels } = await query.graph({
    entity: "sales_channel",
    fields: ["id", "name"],
  });
  const defaultSalesChannel =
    salesChannels.find((sc) => sc.name === "Default Sales Channel") ??
    salesChannels[0];

  if (!defaultSalesChannel) {
    logger.warn(
      "Configurator seed: aucun sales channel trouvé (lancez d'abord le seed initial). Skipping."
    );
    return;
  }

  const { data: shippingProfiles } = await query.graph({
    entity: "shipping_profile",
    fields: ["id"],
  });
  const shippingProfile = shippingProfiles[0];

  // 3. Crée les produits du configurator (idempotent)
  const { data: existingProducts } = await query.graph({
    entity: "product",
    fields: ["handle"],
  });
  const existingHandles = new Set(existingProducts.map((p) => p.handle));
  const toCreate = KOGEI_PRODUCTS.filter(
    (p) => !existingHandles.has(p.handle)
  );

  if (toCreate.length === 0) {
    logger.info("Configurator seed: produits déjà présents. Skipping.");
    return;
  }

  logger.info(`Configurator seed: création de ${toCreate.length} produit(s)...`);

  await createProductsWorkflow(container).run({
    input: {
      products: toCreate.map((p) => ({
        title: p.title,
        handle: p.handle,
        description: p.description,
        status: ProductStatus.PUBLISHED,
        shipping_profile_id: shippingProfile?.id,
        options: [{ title: "Format", values: ["Standard"] }],
        variants: [
          {
            title: "Standard",
            sku: p.handle.toUpperCase(),
            manage_inventory: false,
            options: { Format: "Standard" },
            prices: [{ amount: p.price, currency_code: "eur" }],
          },
        ],
        sales_channels: [{ id: defaultSalesChannel.id }],
      })),
    },
  });

  logger.info("Configurator seed: terminé.");
}
