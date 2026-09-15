/**
 * Adresse publique d'un article sur le storefront (sans le préfixe pays),
 * telle que le backend la sert : page autonome à la racine, rubrique
 * « Offrir », ou blog.
 */
export function publicPath(post: {
  slug: string
  path?: string | null
  offrir?: boolean
}): string {
  if (post.path) return `/${post.path}`
  return post.offrir ? `/offrir/${post.slug}` : `/blog/${post.slug}`
}
