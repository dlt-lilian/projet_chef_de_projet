import { model } from "@medusajs/framework/utils"

/**
 * Étape de fabrication d'une commande, suivie par l'atelier.
 *
 * Une ligne par commande, reliée à Order par un link (cf. `src/links`).
 * C'est ce link qui fait remonter le modèle dans le module graph, et donc dans
 * les colonnes disponibles du tableau /app/orders.
 *
 * `stage` fait foi (clé stable, c'est elle que lit le code) ; `label` est sa
 * traduction figée au moment de l'écriture. Ce doublon est volontaire : la
 * 2.14.0 n'a pas de cell renderer, la colonne affiche donc la valeur brute de
 * la base. Sans `label`, le tableau montrerait « in_production ».
 */
const ProductionStatus = model.define("production_status", {
  id: model.id({ prefix: "prodstat" }).primaryKey(),
  stage: model.text(),
  label: model.text(),
})

export default ProductionStatus
