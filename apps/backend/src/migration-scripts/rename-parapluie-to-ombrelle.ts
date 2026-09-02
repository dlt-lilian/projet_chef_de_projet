import { MedusaContainer } from "@medusajs/framework";
import { ContainerRegistrationKeys } from "@medusajs/framework/utils";
import { updateProductsWorkflow } from "@medusajs/medusa/core-flows";
import { CONFIGURATOR_MODULE } from "../modules/configurator";
import type ConfiguratorModuleService from "../modules/configurator/service";

// ──────────────────────────────────────────────────────────────────────
// Renommage « parapluie » → « ombrelle ».
//
// POURQUOI un migration-script et non le seed : `seed-configurator-products`
// ne crée que les produits ABSENTS (filtre `!existingHandles.has`). Sur une
// base où « parapluie » existe déjà, il ne touche à rien — c'est la raison
// pour laquelle les descriptions propres du seed ne sont jamais arrivées en
// production. Un renommage exige une ÉCRITURE sur l'existant.
//
// POURQUOI renommer : « ombrelle japonaise » vaut 1 000 recherches mensuelles.
// « parapluie japonais » en vaut 65, et cette famille de requêtes est
// majoritairement entomologique (le « parapluie japonais » est une technique
// d'échantillonnage d'insectes enseignée en SVT) : le trafic qu'elle apporte
// ne convertit pas.
//
// Le handle change → l'URL change → la redirection 301 est portée par
// `apps/storefront/next.config.js`. Les deux doivent être déployés ensemble.
//
// Idempotent : si « ombrelle » existe déjà, le script ne fait rien. Il
// n'ÉCHOUE pas non plus si « parapluie » est absent (base fraîche, déjà
// migrée) — un migration-script qui plante bloque tout le démarrage.
// ──────────────────────────────────────────────────────────────────────

const OLD_HANDLE = "parapluie";
const NEW_HANDLE = "ombrelle";

const NEW_TITLE = "Ombrelle Japonaise";

// Aucune allégation d'origine : les produits sont de STYLE japonais mais
// conçus et fabriqués en France. « japonais » qualifie ici le produit, jamais
// la fabrication ni la matière.
// « wagasa » est volontairement absent : ce mot-clé est assigné à l'éditorial,
// l'employer ici cannibaliserait l'article à venir.
const NEW_DESCRIPTION =
  "Ombrelle japonaise à configurer en 3D : couleur, toile, gravure du manche. " +
  "Voyez le rendu avant de commander. Conçue et fabriquée en France.";

export default async function rename_parapluie_to_ombrelle({
  container,
}: {
  container: MedusaContainer;
}) {
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER);
  const query = container.resolve(ContainerRegistrationKeys.QUERY);

  // ── 1. Produit Medusa ────────────────────────────────────────────────
  const { data: products } = await query.graph({
    entity: "product",
    fields: ["id", "handle", "variants.id", "variants.sku"],
  });

  const already = products.find((p) => p.handle === NEW_HANDLE);
  const target = products.find((p) => p.handle === OLD_HANDLE);

  if (already) {
    logger.info(`Renommage ombrelle : « ${NEW_HANDLE} » déjà présent. Skipping.`);
  } else if (!target) {
    logger.warn(
      `Renommage ombrelle : aucun produit « ${OLD_HANDLE} » trouvé. Skipping.`
    );
  } else {
    // Le SKU est repris tel quel dans le JSON-LD `Product.sku` : le laisser à
    // « PARAPLUIE » publierait une donnée structurée incohérente avec l'URL.
    // Pas de prédicat de type ici : `query.graph` renvoie des lignes dont le
    // type déclaré n'admet pas de restriction, d'où un `flatMap` qui écarte
    // les variantes sans id plutôt qu'un `filter` typé.
    const variants = (target.variants ?? []).flatMap((v) => {
      const id: unknown = v?.id;
      if (typeof id !== "string") return [];
      const renameSku = v?.sku === OLD_HANDLE.toUpperCase();
      return [{ id, ...(renameSku ? { sku: NEW_HANDLE.toUpperCase() } : {}) }];
    });

    await updateProductsWorkflow(container).run({
      input: {
        selector: { handle: OLD_HANDLE },
        update: {
          handle: NEW_HANDLE,
          title: NEW_TITLE,
          description: NEW_DESCRIPTION,
          ...(variants.length ? { variants } : {}),
        },
      },
    });

    logger.info(
      `Renommage ombrelle : produit « ${OLD_HANDLE} » → « ${NEW_HANDLE} » (titre, description, SKU).`
    );
  }

  // ── 2. Configuration 3D (module configurator) ────────────────────────
  // Le storefront appelle /store/configurator/{handle} : sans cette ligne, la
  // fiche renommée servirait le repli statique au lieu de la config admin.
  const svc: ConfiguratorModuleService = container.resolve(CONFIGURATOR_MODULE);

  const existingNew = await svc.getConfigByHandle(NEW_HANDLE);
  if (existingNew) {
    logger.info(
      `Renommage ombrelle : config 3D « ${NEW_HANDLE} » déjà présente. Skipping.`
    );
    return;
  }

  const existingOld = await svc.getConfigByHandle(OLD_HANDLE);
  if (!existingOld) {
    logger.warn(
      `Renommage ombrelle : aucune config 3D « ${OLD_HANDLE} » trouvée. Skipping.`
    );
    return;
  }

  await svc.updateConfiguratorProducts({
    id: existingOld.id,
    handle: NEW_HANDLE,
  });

  logger.info(
    `Renommage ombrelle : config 3D « ${OLD_HANDLE} » → « ${NEW_HANDLE} ».`
  );
}
