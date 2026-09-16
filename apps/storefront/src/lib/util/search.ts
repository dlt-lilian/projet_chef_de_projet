/**
 * Retire casse et accents pour comparer « Éventail » et « eventail ».
 * Plage U+0300–U+036F : diacritiques combinants isolés par la normalisation NFD.
 *
 * Partagé par la recherche produits et articles : les deux doivent réagir à
 * l'identique à une même saisie.
 */
export function normalizeForSearch(value: string): string {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
}
