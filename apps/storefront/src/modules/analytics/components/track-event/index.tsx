"use client"

import {
  EcommerceEventName,
  EcommercePayload,
  trackEcommerce,
} from "@lib/util/analytics-events"
import { useEffect } from "react"

type TrackEventProps = {
  event: EcommerceEventName
  payload: EcommercePayload
  /**
   * Identité de CE QUI EST OBSERVÉ (fiche produit, panier, commande) — pas de
   * son contenu. Tant qu'elle ne change pas, l'événement n'est pas réémis.
   *
   * Sans cette clé, l'alternative serait de dépendre du contenu du `payload` :
   * modifier une quantité depuis la page panier suffirait alors à recompter une
   * consultation de panier, et le taux de conversion s'effondrerait pour une
   * raison qui n'a rien à voir avec le parcours réel.
   */
  dedupeKey: string
}

/**
 * Émet un événement e-commerce au montage — pour les pages rendues côté
 * serveur, où le rendu LUI-MÊME est ce qu'on mesure : consultation de fiche, de
 * panier, entrée dans le tunnel.
 *
 * Composant sans rendu : il n'existe que pour disposer d'un effet client dans
 * un arbre serveur. Les événements déclenchés par un GESTE (ajout au panier,
 * choix d'un mode de livraison) n'ont pas besoin de lui — ils appellent
 * `trackEcommerce` directement depuis leur gestionnaire, là où l'action réussit.
 *
 * Le calcul du `payload` reste côté serveur : seul le résultat, quelques
 * centaines d'octets, traverse la frontière — plutôt que le produit ou le
 * panier entier, qu'il faudrait resérialiser pour ce seul usage.
 */
export default function TrackEvent({
  event,
  payload,
  dedupeKey,
}: TrackEventProps) {
  useEffect(() => {
    trackEcommerce(event, payload)
    // `payload` est volontairement HORS dépendances : c'est un objet littéral,
    // reconstruit à chaque rendu du parent, qui déclencherait donc l'effet en
    // boucle. `dedupeKey` porte seule la question « est-ce toujours la même
    // chose que j'observe ? », et la réponse à cette question suffit ici.
  }, [event, dedupeKey])

  return null
}
