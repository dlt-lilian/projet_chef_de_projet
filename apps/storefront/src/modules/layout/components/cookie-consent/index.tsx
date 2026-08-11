"use client"

import { useConsent } from "@lib/context/consent-context"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import CookiePreferencesButton from "./floating-button"
import CookiePreferencesDialog from "./preferences-dialog"

/**
 * Bandeau de consentement cookies (RGPD / délibération CNIL n° 2020-091).
 *
 * Points non négociables encodés dans ce composant :
 *
 *  - « Tout refuser » a EXACTEMENT le même poids visuel que « Tout accepter »
 *    (même hauteur, même largeur, même graisse) : le refus doit être aussi
 *    simple que l'accord.
 *  - Aucune croix de fermeture. Fermer sans répondre laisserait un état
 *    ambigu, et poursuivre la navigation ne vaut pas consentement.
 *  - Le bandeau ne piège pas le focus et laisse la boutique entièrement
 *    utilisable : conditionner l'accès à l'acceptation serait un
 *    « cookie wall », interdit sauf alternative équivalente.
 *
 * Monté au niveau du layout pays → présent aussi bien sur la boutique que dans
 * le tunnel de commande. Il ne rend rien tant que le cookie n'a pas été relu
 * (`needsChoice` reste faux), donc rien ne diverge à l'hydratation.
 */
export default function CookieConsent() {
  const {
    isLoaded,
    needsChoice,
    isPreferencesOpen,
    acceptAll,
    rejectAll,
    openPreferences,
  } = useConsent()

  return (
    <>
      {needsChoice && !isPreferencesOpen && (
        <div
          role="dialog"
          // Non modal : la boutique reste utilisable et le focus n'est pas
          // piégé — un bandeau bloquant serait un « cookie wall ».
          aria-modal="false"
          aria-labelledby="cookie-banner-title"
          // Au-dessus des autres couches flottantes (nav `z-50`, barre d'achat
          // mobile `z-50`, sélecteurs pays/langue `z-[900]`) : le choix doit
          // rester atteignable quoi qu'il y ait à l'écran.
          className="fixed inset-x-0 bottom-0 z-[950] border-t border-grey-20 bg-white shadow-[0_-4px_10px_0_rgba(30,41,57,0.15)]"
        >
          <div className="content-container flex flex-col gap-4 py-5 medium:flex-row medium:items-center medium:justify-between medium:gap-8">
            <div className="max-w-[640px]">
              <p
                id="cookie-banner-title"
                className="text-sm font-semibold text-grey-90"
              >
                Nous utilisons des cookies
              </p>
              <p className="mt-1 text-sm leading-relaxed text-grey-70">
                Certains sont indispensables au fonctionnement de la boutique
                (panier, compte, paiement). Les autres, destinés à la mesure
                d&apos;audience et à la publicité, ne seront déposés qu&apos;avec
                votre accord.{" "}
                <LocalizedClientLink
                  href="/cookies"
                  className="underline underline-offset-2 transition-colors hover:text-primary"
                >
                  En savoir plus
                </LocalizedClientLink>
              </p>
            </div>

            <div className="flex flex-col gap-2 xsmall:flex-row xsmall:items-center medium:shrink-0">
              <button
                type="button"
                onClick={openPreferences}
                className="order-last h-11 px-2 text-sm font-medium text-grey-70 underline underline-offset-2 transition-colors hover:text-primary focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 xsmall:order-first"
              >
                Personnaliser
              </button>
              {/* Refus et acceptation : styles STRICTEMENT identiques (même
                  hauteur, même largeur minimale, même graisse, même contraste).
                  Mettre en avant l'un des deux orienterait le choix — c'est le
                  défaut que la CNIL sanctionne. */}
              <button
                type="button"
                onClick={rejectAll}
                className="h-11 rounded-xl border border-primary bg-white px-6 text-sm font-semibold text-primary transition-colors hover:bg-grey-10 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 xsmall:min-w-[130px]"
              >
                Tout refuser
              </button>
              <button
                type="button"
                onClick={acceptAll}
                className="h-11 rounded-xl border border-primary bg-white px-6 text-sm font-semibold text-primary transition-colors hover:bg-grey-10 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 xsmall:min-w-[130px]"
              >
                Tout accepter
              </button>
            </div>
          </div>
        </div>
      )}

      {/* `isLoaded &&` est indispensable : sans lui, le bouton s'afficherait
          au tout premier rendu — avant même la relecture du cookie — puis
          disparaîtrait derrière le bandeau chez qui n'a jamais répondu. */}
      {isLoaded && !needsChoice && !isPreferencesOpen && (
        <CookiePreferencesButton />
      )}

      {isPreferencesOpen && <CookiePreferencesDialog />}
    </>
  )
}
