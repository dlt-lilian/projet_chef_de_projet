"use client"

import { useGoogleConsent } from "@lib/hooks/use-google-consent"
import {
  GA_MEASUREMENT_ID,
  GTM_CONTAINER_ID,
  USE_GA_DIRECT,
  USE_GTM,
  consentBootstrapScript,
} from "@lib/util/analytics"
import Script from "next/script"

/**
 * Balises Google, conditionnées au consentement.
 *
 * Deux modes exclusifs, selon la variable d'environnement renseignée :
 * conteneur Tag Manager, ou GA4 en direct. Aucun des deux n'est monté sans
 * accord — c'est le vrai verrou : pas de balise dans le DOM, donc aucune
 * requête vers Google.
 *
 * ⚠️ Le `<noscript>` fourni par Google avec le snippet GTM est délibérément
 * ABSENT : une iframe se charge sans JavaScript, donc sans qu'on puisse lire
 * le consentement — elle déclencherait le conteneur pour tout le monde,
 * exactement ce que le bandeau est censé empêcher. Sa seule utilité serait de
 * mesurer les visiteurs sans JS, or la boutique ne fonctionne pas sans JS.
 *
 * ⚠️ Les vues de page en navigation interne ne sont PAS émises ici. GA4 les
 * détecte déjà via les événements d'historique du navigateur (« Enhanced
 * measurement »), que Next déclenche par `history.pushState`. Les émettre en
 * plus les compterait DEUX fois — et ce doublon subsiste même avec
 * `send_page_view: false`, ce réglage ne désarmant que le hit initial. La
 * mesure automatique doit donc rester activée côté propriété GA4.
 */
export default function GoogleTags() {
  // Appelé inconditionnellement (règle des hooks) : il synchronise le Consent
  // Mode et purge les cookies même quand plus aucune balise n'est montée.
  const { analytics, marketing } = useGoogleConsent()

  if (USE_GTM) {
    // Le conteneur peut héberger des balises de mesure ET de publicité : il se
    // charge dès qu'une des deux finalités est acceptée, le Consent Mode
    // filtrant ensuite balise par balise.
    if (!analytics && !marketing) {
      return null
    }

    return (
      <Script id="gtm-init" strategy="afterInteractive">
        {/* Un SEUL script inline : consentement et chargement du conteneur
            partagent la même exécution, l'ordre est donc garanti sans dépendre
            de l'ordre d'injection de deux balises séparées. */}
        {`${consentBootstrapScript(analytics, marketing)}
(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
})(window,document,'script','dataLayer',${JSON.stringify(GTM_CONTAINER_ID)});`}
      </Script>
    )
  }

  if (!USE_GA_DIRECT || !analytics) {
    return null
  }

  return (
    <>
      <Script id="ga-init" strategy="afterInteractive">
        {`${consentBootstrapScript(analytics, marketing)}
gtag('js', new Date());
gtag('config', ${JSON.stringify(GA_MEASUREMENT_ID)});`}
      </Script>

      <Script
        src={`https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(
          GA_MEASUREMENT_ID
        )}`}
        strategy="afterInteractive"
      />
    </>
  )
}
