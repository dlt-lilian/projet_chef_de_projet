/**
 * Style commun de TOUS les champs de saisie du site, calqué sur la barre de
 * recherche de la navbar : fond gris, coins arrondis, anneau bleu au focus.
 *
 * Module sans "use client" : une constante exportée d'un module client arrive
 * dans un composant serveur sous forme de référence, pas de chaîne.
 *
 * Le padding est à part : le champ à label flottant
 * (`@modules/common/components/input`) a besoin d'un padding vertical propre
 * pour loger son label.
 */
export const FIELD_SURFACE_CLASS =
  "bg-gray-200 rounded-xl text-gray-900 placeholder:text-gray-400 " +
  "focus:outline-none focus:ring-2 focus:ring-sky-950"

export const FIELD_CLASS = `${FIELD_SURFACE_CLASS} w-full px-4 py-2`
