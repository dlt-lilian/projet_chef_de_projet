"use client"

import { useConsent } from "@lib/context/consent-context"
import {
  clearAdvertisingCookies,
  clearAnalyticsCookies,
  googleConsentSignals,
  gtagPush,
} from "@lib/util/analytics"
import { useEffect } from "react"

/**
 * Maintient les balises Google alignées sur les préférences de l'utilisateur,
 * et nettoie ce qui n'a plus lieu d'être.
 *
 * Deux situations que le simple démontage du composant ne couvre PAS :
 *
 *  1. Changement de finalité sans démontage — accepter la publicité alors que
 *     la mesure d'audience l'était déjà ne remonte pas le composant, il faut
 *     donc pousser explicitement le nouvel état.
 *  2. Retrait — retirer le `<script>` du DOM ne décharge pas le code déjà
 *     exécuté et laisse les cookies en place. On coupe par Consent Mode, puis
 *     on efface.
 *
 * L'effet s'exécute APRÈS le commit React, donc après que la balise a été
 * retirée de l'arbre : `window.gtag` est encore en mémoire à ce moment-là,
 * c'est précisément ce qui permet au signal de retrait de passer.
 */
export function useGoogleConsent() {
  const { hasConsent } = useConsent()

  const analytics = hasConsent("analytics")
  const marketing = hasConsent("marketing")

  useEffect(() => {
    gtagPush("consent", "update", googleConsentSignals(analytics, marketing))

    // Purges ciblées : refuser la publicité ne doit pas effacer les cookies de
    // mesure d'audience encore consentis, et réciproquement. Sans objet si
    // aucun cookie ne correspond.
    if (!analytics) {
      clearAnalyticsCookies()
    }

    if (!marketing) {
      clearAdvertisingCookies()
    }
  }, [analytics, marketing])

  return { analytics, marketing }
}
