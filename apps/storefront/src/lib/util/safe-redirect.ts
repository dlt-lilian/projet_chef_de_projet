/**
 * Vrai uniquement pour un chemin interne au site.
 *
 * Ces valeurs viennent de l'URL puis d'un champ de formulaire, et finissent
 * dans un `redirect()` : sans filtre, `?redirect=https://…` ferait du site un
 * tremplin vers un domaine tiers. `//` est rejeté aussi, c'est une URL
 * protocol-relative (`//exemple.com` mène hors du site).
 *
 * À appeler des deux côtés : au rendu du formulaire ET dans l'action, le
 * contenu du FormData restant sous contrôle du client.
 */
export function isSafeInternalPath(value: unknown): value is string {
  return (
    typeof value === "string" &&
    value.startsWith("/") &&
    !value.startsWith("//")
  )
}
