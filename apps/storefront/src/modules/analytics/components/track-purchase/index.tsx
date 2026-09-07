"use client"

import { trackPurchaseOnce } from "@lib/util/analytics-events"
import { HttpTypes } from "@medusajs/types"
import { useEffect } from "react"

/**
 * Émet `purchase` sur la page de confirmation — l'événement qui porte le chiffre
 * d'affaires, et le seul qu'un doublon fausse durablement : GA4 ne permet pas
 * de retirer une transaction déjà enregistrée.
 *
 * À la différence de `TrackEvent`, la commande entière traverse ici la frontière
 * serveur/client. C'est délibéré : `trackPurchaseOnce` doit consulter la mémoire
 * des commandes déjà comptées AVANT de construire quoi que ce soit, et rendre
 * la main sans rien émettre si celle-ci est déjà connue. Un `payload` calculé
 * côté serveur imposerait de le préparer même quand il ne sert à rien.
 *
 * La déduplication elle-même vit dans `analytics-events` : elle repose sur du
 * stockage navigateur, donc sur le consentement — deux choses qui n'ont pas leur
 * place dans un composant de présentation.
 */
export default function TrackPurchase({
  order,
}: {
  order: HttpTypes.StoreOrder
}) {
  useEffect(() => {
    trackPurchaseOnce(order)
    // Voir `TrackEvent` : l'identifiant de commande suffit à décider s'il s'agit
    // toujours du même achat.
  }, [order.id])

  return null
}
