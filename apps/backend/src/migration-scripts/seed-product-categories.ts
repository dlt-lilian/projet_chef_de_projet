import { MedusaContainer } from "@medusajs/framework";
import { ContainerRegistrationKeys } from "@medusajs/framework/utils";
import { createProductCategoriesWorkflow } from "@medusajs/medusa/core-flows";
import { updateProductsWorkflow } from "@medusajs/medusa/core-flows";

// ──────────────────────────────────────────────────────────────────────
// Catégories produit — une par famille.
//
// POURQUOI. L'étude de mots-clés assigne « baguettes japonaises » (400
// recherches/mois) et « éventail japonais » (185) à des pages de CATÉGORIE, pas
// aux fiches. Ce sont des requêtes larges : l'internaute compare avant
// d'acheter. Une fiche produit, transactionnelle, s'y positionne mal ; une page
// de catégorie qui explique et oriente s'y positionne bien.
//
// La navigation principale continue de pointer sur les fiches (décision du
// 2026-08-23 : une seule référence par famille, un listing d'un produit
// n'ajouterait qu'un clic). Les catégories sont atteintes par le fil d'Ariane
// et le pied de page.
//
// ⚠️ La catégorie « ombrelle » ne cible AUCUN mot-clé : « ombrelle japonaise »
// (1 000/mois) appartient à la FICHE, c'est le mot-clé le plus fort du corpus.
// Elle existe pour la cohérence du fil d'Ariane et porte un `noindex` côté
// storefront — sans quoi elle concurrencerait la page qu'elle est censée
// alimenter. Voir `lib/content/categories.ts`.
//
// Idempotent : les catégories déjà présentes sont ignorées, et le rattachement
// des produits est rejoué sans dommage.
// ──────────────────────────────────────────────────────────────────────

const CATEGORIES = [
  {
    handle: "baguettes-japonaises",
    name: "Baguettes japonaises",
    // Rendue sous le H1 par CategoryTemplate. Le contenu long vit dans
    // `apps/storefront/src/lib/content/categories.ts`.
    description:
      "Des baguettes japonaises que vous configurez : couleur, teinte du bois et gravure au choix, vues en 3D avant commande. Conçues et fabriquées en France.",
    productHandle: "baguettes",
  },
  {
    handle: "eventail-japonais",
    name: "Éventails japonais",
    description:
      "Des éventails pliants de style japonais, montés à la demande : monture, papier, motif et finition des vis au choix. Conçus et fabriqués en France.",
    productHandle: "eventail",
  },
  {
    handle: "ombrelle-japonaise",
    name: "Ombrelles japonaises",
    description:
      "Des ombrelles de style japonais configurables : couleur, toile et gravure du manche au choix. Conçues et fabriquées en France.",
    productHandle: "ombrelle",
  },
];

export default async function seed_product_categories({
  container,
}: {
  container: MedusaContainer;
}) {
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER);
  const query = container.resolve(ContainerRegistrationKeys.QUERY);

  // ── 1. Création des catégories manquantes ────────────────────────────
  const { data: existingCategories } = await query.graph({
    entity: "product_category",
    fields: ["id", "handle"],
  });
  const existingHandles = new Set(
    existingCategories.map((c: { handle: string }) => c.handle)
  );

  const toCreate = CATEGORIES.filter((c) => !existingHandles.has(c.handle));

  if (toCreate.length > 0) {
    await createProductCategoriesWorkflow(container).run({
      input: {
        product_categories: toCreate.map((c) => ({
          name: c.name,
          handle: c.handle,
          description: c.description,
          is_active: true,
        })),
      },
    });
    logger.info(
      `Catégories : création de ${toCreate.length} catégorie(s) — ${toCreate
        .map((c) => c.handle)
        .join(", ")}.`
    );
  } else {
    logger.info("Catégories : déjà présentes, aucune création.");
  }

  // ── 2. Rattachement des produits ─────────────────────────────────────
  // Relu APRÈS création pour disposer des identifiants fraîchement générés.
  const { data: categories } = await query.graph({
    entity: "product_category",
    fields: ["id", "handle"],
  });
  const categoryIdByHandle = new Map<string, string>(
    categories.map((c: { id: string; handle: string }) => [c.handle, c.id])
  );

  const { data: products } = await query.graph({
    entity: "product",
    fields: ["id", "handle", "categories.id"],
  });

  for (const cat of CATEGORIES) {
    const categoryId = categoryIdByHandle.get(cat.handle);
    const product = products.find(
      (p: { handle: string }) => p.handle === cat.productHandle
    );

    if (!categoryId || !product) {
      logger.warn(
        `Catégories : rattachement ignoré pour « ${cat.handle} » (catégorie ou produit « ${cat.productHandle} » introuvable).`
      );
      continue;
    }

    // `category_ids` REMPLACE la liste : on repart des rattachements existants
    // pour ne pas détacher le produit d'une catégorie créée à la main en admin.
    const current: string[] = (product.categories ?? [])
      .map((c: { id?: string } | null) => c?.id)
      .filter((id: string | undefined): id is string => typeof id === "string");

    if (current.includes(categoryId)) {
      logger.info(`Catégories : « ${cat.productHandle} » déjà rattaché.`);
      continue;
    }

    await updateProductsWorkflow(container).run({
      input: {
        selector: { id: product.id },
        update: { category_ids: [...current, categoryId] },
      },
    });
    logger.info(
      `Catégories : « ${cat.productHandle} » rattaché à « ${cat.handle} ».`
    );
  }

  // TODO: la catégorie « produits » (créée en admin, générique, « Ensemble des
  // produits vendu sur le site ») fait désormais doublon avec les trois
  // ci-dessus et ne cible aucune requête. Elle reste indexée et présente au
  // sitemap. À dépublier depuis l'admin — non fait ici : supprimer une donnée
  // saisie à la main n'est pas le rôle d'un script de migration.
}
