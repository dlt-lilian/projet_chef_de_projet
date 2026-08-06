import { getBaseURL } from "@lib/util/env"
import {
  SITE_DEFAULT_DESCRIPTION,
  SITE_DEFAULT_TITLE,
  SITE_NAME,
  SITE_TITLE_TEMPLATE,
  OG_LOCALE,
  organizationJsonLd,
  websiteJsonLd,
  localeForCountry,
} from "@lib/util/seo"
import { Metadata } from "next"
import "styles/globals.css"

import localFont from "next/font/local"
import JsonLd from "@modules/common/components/json-ld"
import { ConsentProvider } from "@lib/context/consent-context"
import CookieConsent from "@modules/layout/components/cookie-consent"

/**
 * Layout racine (porte <html>/<body>).
 *
 * Il vit au niveau [countryCode] — et NON à app/layout.tsx — volontairement :
 * l'attribut <html lang> doit varier par pays (fr-FR, fr-DE… en miroir du
 * hreflang géo-ciblé). Le pays vient du PARAM de route (statique, connu au build
 * via generateStaticParams), pas de headers() : le pré-rendu SSG des pages
 * produit/catégorie/collection/article est donc préservé (headers() les aurait
 * toutes forcées en dynamique).
 *
 * Roadmap traduction : `localeForCountry` centralise le mapping pays → locale ;
 * le jour où /de sera en allemand, sa ligne dans seo.ts bascule en `de-DE` et le
 * <html lang> suit automatiquement.
 */

const satoshi = localFont({
  src: [
    { path: "../../../public/fonts/satoshi/Satoshi-Regular.woff2", weight: "400" },
    { path: "../../../public/fonts/satoshi/Satoshi-Medium.woff2", weight: "500" },
    { path: "../../../public/fonts/satoshi/Satoshi-Bold.woff2", weight: "700" },
  ],
  variable: "--font-satoshi",
})

export const metadata: Metadata = {
  metadataBase: new URL(getBaseURL()),
  title: {
    default: SITE_DEFAULT_TITLE,
    template: SITE_TITLE_TEMPLATE,
  },
  description: SITE_DEFAULT_DESCRIPTION,
  applicationName: SITE_NAME,
  openGraph: {
    type: "website",
    siteName: SITE_NAME,
    locale: OG_LOCALE,
    title: SITE_DEFAULT_TITLE,
    description: SITE_DEFAULT_DESCRIPTION,
  },
  twitter: {
    card: "summary_large_image",
    title: SITE_DEFAULT_TITLE,
    description: SITE_DEFAULT_DESCRIPTION,
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },
}

export default async function CountryLayout(props: {
  children: React.ReactNode
  params: Promise<{ countryCode: string }>
}) {
  const { countryCode } = await props.params

  return (
    <html
      lang={localeForCountry(countryCode)}
      data-mode="light"
      className={satoshi.variable}
    >
    <body>
    <JsonLd data={[organizationJsonLd(), websiteJsonLd()]} />
    {/* Consentement monté ICI, et non dans (main) : le bandeau doit aussi
        couvrir le tunnel de commande, et le lien « Gestion des cookies » du
        pied de page a besoin du même contexte. Composant client dans un layout
        serveur → aucune incidence sur le pré-rendu statique des pages. */}
    <ConsentProvider>
      {/* Placé AVANT <main> : positionné en `fixed`, sa place dans le DOM
          n'change rien visuellement, mais il devient le premier élément de
          l'ordre de tabulation — un lecteur d'écran ou une navigation clavier
          rencontre le choix immédiatement, sans traverser toute la page. */}
      <CookieConsent />
      <main className="relative">{props.children}</main>
    </ConsentProvider>
    </body>
    </html>
  )
}
