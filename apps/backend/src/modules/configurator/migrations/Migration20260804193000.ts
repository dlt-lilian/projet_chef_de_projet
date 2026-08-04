import { Migration } from "@medusajs/framework/mikro-orm/migrations";

/**
 * Tarification des options du configurateur 3D.
 *
 * `price_delta` = supplément EN CENTIMES (entier), ajouté au prix unitaire de
 * la ligne de panier :
 *  - sur `configurator_choice` : facturé quand le client sélectionne ce choix ;
 *  - sur `configurator_option` : forfait facturé quand l'option est utilisée
 *    (n'a de sens que pour le type "engraving", facturé si le texte est saisi).
 *
 * `default 0` → les configurations existantes restent au prix de base, aucune
 * commande passée n'est affectée (les lignes déjà créées portent leur propre
 * `unit_price`).
 *
 * Migration écrite à la main (et non via `medusa db:generate`) : `if not exists`
 * la rend rejouable sans risque.
 */
export class Migration20260804193000 extends Migration {

  override async up(): Promise<void> {
    this.addSql(`alter table if exists "configurator_option" add column if not exists "price_delta" integer not null default 0;`);
    this.addSql(`alter table if exists "configurator_choice" add column if not exists "price_delta" integer not null default 0;`);
  }

  override async down(): Promise<void> {
    this.addSql(`alter table if exists "configurator_option" drop column if exists "price_delta";`);
    this.addSql(`alter table if exists "configurator_choice" drop column if exists "price_delta";`);
  }

}
