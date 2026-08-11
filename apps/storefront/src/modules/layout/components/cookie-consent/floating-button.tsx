"use client"

import { useConsent } from "@lib/context/consent-context"
import { Icon } from "@modules/common/components/my_ui"

/**
 * Accès permanent aux préférences cookies.
 *
 * Le pied de page porte déjà un lien « Gestion des cookies », mais il est
 * absent du tunnel de commande (layout dédié, sans footer) : sans ce bouton,
 * impossible de revenir sur son choix pendant tout le parcours de paiement.
 * Rendu au niveau du layout pays, il couvre donc la boutique ET le checkout.
 *
 * Affiché uniquement une fois un choix exprimé — la logique de visibilité vit
 * chez le parent. Tant que le bandeau est à l'écran, il porte déjà
 * « Personnaliser » : deux points d'entrée simultanés vers la même action
 * brouilleraient le message plutôt que de l'aider.
 *
 * Position basse-gauche : le nudge « livraison offerte » occupe le coin
 * basse-droite. Sur mobile, la barre d'achat des fiches produit
 * (`fixed inset-x-0 bottom-0 z-50`, masquée au-delà de 1024 px) passe sous ce
 * bouton — chevauchement mineur et transitoire, assumé pour garder un point
 * d'accès constant plutôt qu'un bouton qui disparaîtrait par endroits.
 */
export default function CookiePreferencesButton() {
  const { openPreferences } = useConsent()

  return (
    <button
      type="button"
      onClick={openPreferences}
      aria-label="Gestion des cookies"
      title="Gestion des cookies"
      className="fixed bottom-5 left-5 z-[940] flex h-10 w-10 items-center justify-center rounded-circle border border-grey-20 bg-white text-grey-70 shadow-[var(--shadow-card)] transition-colors hover:text-primary focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
    >
      <Icon name="cookie" size={18} />
    </button>
  )
}
