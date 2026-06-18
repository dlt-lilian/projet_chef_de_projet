import { MedusaContainer } from "@medusajs/framework";
import {
  ContainerRegistrationKeys,
  ProductStatus,
} from "@medusajs/framework/utils";
import { createProductsWorkflow } from "@medusajs/medusa/core-flows";

// ──────────────────────────────────────────────────────────────────────
// Seed des produits Kogei (viewer 3D + customizer).
// Les handles DOIVENT correspondre à KOGEI_HANDLES / MODEL_PATHS côté
// storefront, sinon la page produit ne déclenche pas le template 3D.
//
// S'exécute automatiquement via `medusa db:migrate` (predeploy), une seule
// fois (tracké dans script_migrations). Idempotent : ne recrée pas un
// produit dont le handle existe déjà.
// ──────────────────────────────────────────────────────────────────────

// Handles alignés avec CONFIGURABLE_HANDLES du storefront (module configurator).
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

export default async function seed_kogei_products({
  container,
}: {
  container: MedusaContainer;
}) {
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER);
  const query = container.resolve(ContainerRegistrationKeys.QUERY);

  // Sales channel par défaut (créé par le seed initial)
  const { data: salesChannels } = await query.graph({
    entity: "sales_channel",
    fields: ["id", "name"],
  });
  const defaultSalesChannel =
    salesChannels.find((sc) => sc.name === "Default Sales Channel") ??
    salesChannels[0];

  if (!defaultSalesChannel) {
    logger.warn(
      "Kogei seed: aucun sales channel trouvé (lancez d'abord le seed initial). Skipping."
    );
    return;
  }

  // Shipping profile par défaut (créé par le core)
  const { data: shippingProfiles } = await query.graph({
    entity: "shipping_profile",
    fields: ["id"],
  });
  const shippingProfile = shippingProfiles[0];

  // Idempotence : ne crée que les handles absents
  const { data: existingProducts } = await query.graph({
    entity: "product",
    fields: ["handle"],
  });
  const existingHandles = new Set(existingProducts.map((p) => p.handle));
  const toCreate = KOGEI_PRODUCTS.filter(
    (p) => !existingHandles.has(p.handle)
  );

  if (toCreate.length === 0) {
    logger.info("Kogei seed: produits déjà présents. Skipping.");
    return;
  }

  logger.info(`Kogei seed: création de ${toCreate.length} produit(s)...`);

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

  logger.info("Kogei seed: terminé.");
}
