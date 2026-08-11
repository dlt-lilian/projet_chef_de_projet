/**
 * URL personnalisée d'une page autonome (article dont `path` est renseigné).
 *
 * Le storefront sert ces pages via une route dynamique d'un seul segment,
 * placée à la racine du pays : `/fr/{path}`. En Next.js une route FIXE gagne
 * toujours sur une route dynamique → un `path` qui reprend le segment d'une
 * page existante ne s'afficherait jamais. D'où la liste de réservés.
 */

/** Segments occupés par une route fixe du storefront. */
const RESERVED_PATHS = new Set([
  "account",
  "api",
  "blog",
  "cart",
  "categories",
  "checkout",
  "collections",
  "contact",
  "cookies",
  "order",
  "products",
  "store",
])

/**
 * Met l'URL saisie en forme : minuscules, sans accent, espaces en tirets, et
 * sans les caractères interdits dans une URL propre. Les slashes de début et
 * de fin sont tolérés (« /cgv/ » → « cgv ») mais ceux du milieu sont conservés
 * pour que `validatePagePath` les refuse explicitement plutôt que de les
 * gommer en silence. Renvoie `null` si la saisie est vide → article de blog.
 */
export function normalizePagePath(input: unknown): string | null {
  if (typeof input !== "string") return null

  const cleaned = input
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .replace(/[^a-z0-9\s/-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^[/-]+|[/-]+$/g, "")

  return cleaned || null
}

/**
 * Message d'erreur si l'URL est inutilisable, `null` si elle est valide.
 * `path` doit avoir été passé par `normalizePagePath` au préalable.
 */
export function validatePagePath(path: string): string | null {
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(path)) {
    return `URL invalide : "${path}". Minuscules, chiffres et tirets uniquement, sur un seul segment (pas de "/").`
  }

  if (RESERVED_PATHS.has(path)) {
    return `L'URL "/${path}" est réservée par une page existante du site.`
  }

  return null
}
