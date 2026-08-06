"use client"

import { useConsent } from "@lib/context/consent-context"

/**
 * Point d'entrée permanent vers les préférences cookies.
 *
 * Obligatoire, pas décoratif : le RGPD (art. 7.3) exige que retirer son
 * consentement soit aussi simple que de le donner. Une fois le bandeau
 * répondu, ce lien est le SEUL moyen de revenir sur son choix — il doit donc
 * rester présent sur toutes les pages (d'où sa place dans le pied de page).
 */
export default function CookiePreferencesLink({
  className,
}: {
  className?: string
}) {
  const { openPreferences } = useConsent()

  return (
    <button type="button" onClick={openPreferences} className={className}>
      Gestion des cookies
    </button>
  )
}
