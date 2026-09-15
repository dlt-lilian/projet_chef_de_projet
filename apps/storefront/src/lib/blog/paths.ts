import type { BlogPostPreview } from "./types"

/**
 * Chemin public d'un contenu rédigé dans le backoffice, sans le préfixe pays
 * (LocalizedClientLink l'ajoute) :
 *   · page autonome       → /{path}
 *   · rubrique « Offrir » → /offrir/{slug}
 *   · article de blog     → /blog/{slug}
 *
 * À utiliser partout où l'on ne sait pas d'avance dans quelle rubrique vit
 * l'article (cartes, résultats de recherche) : un lien recomposé à la main en
 * `/blog/…` tomberait en 404 dès que l'article passe dans « Offrir ».
 *
 * Module volontairement sans dépendance : BlogCard, qui l'importe, est rendu
 * par un composant client (BlogList) et n'a pas à embarquer les appels réseau
 * de `lib/blog/index.ts`.
 */
export function articlePath(
  post: Pick<BlogPostPreview, "slug" | "path" | "offrir">
): string {
  if (post.path) return `/${post.path}`
  return post.offrir ? `/offrir/${post.slug}` : `/blog/${post.slug}`
}
