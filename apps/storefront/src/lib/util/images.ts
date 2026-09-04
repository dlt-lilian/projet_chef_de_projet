import { isAllowedImageHost } from "./image-hosts"

/**
 * Le `src` peut-il passer par l'optimiseur de next/image ?
 *
 * Pourquoi ce garde-fou existe : une bonne partie des visuels du site est
 * saisie depuis l'admin (slider, galerie d'accueil, couvertures et blocs
 * d'articles), donc avec des hôtes imprévisibles. Or next/image ne se contente
 * pas d'échouer sur un host absent de `remotePatterns` : il **lève une erreur**
 * et casse le rendu de la page entière.
 *
 * D'où la règle : on optimise les hôtes connus (cf. `image-hosts.js`) et on
 * sert les autres tels quels via `unoptimized`. Une image d'un hôte inconnu
 * reste lourde, mais la page tient — et l'ajout d'une ligne dans IMAGE_HOSTS
 * suffit à la faire basculer côté optimisé.
 *
 * @example
 * <Image src={src} unoptimized={!isOptimizable(src)} … />
 */
export function isOptimizable(src?: string | null): boolean {
  if (!src) return false

  // Chemins absolus (`/logo.svg`) et data-URI : servis par Next lui-même, ils
  // ne passent jamais par le filtre `remotePatterns`.
  if (src.startsWith("/") || src.startsWith("data:")) return true

  try {
    return isAllowedImageHost(new URL(src).hostname)
  } catch {
    // `new URL` a échoué → ce n'est pas une URL absolue, donc un chemin
    // relatif servi par notre propre domaine.
    return true
  }
}
