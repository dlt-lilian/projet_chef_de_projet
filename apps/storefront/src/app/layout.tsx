import { getBaseURL } from "@lib/util/env"
import {
  SITE_DEFAULT_DESCRIPTION,
  SITE_DEFAULT_TITLE,
  SITE_NAME,
  SITE_TITLE_TEMPLATE,
  OG_LOCALE,
  organizationJsonLd,
  websiteJsonLd,
} from "@lib/util/seo"
import { Metadata } from "next"
import "styles/globals.css"

import localFont from "next/font/local"
import JsonLd from "@modules/common/components/json-ld"

const supreme = localFont({
  src: [
    { path: "../../public/fonts/Supreme-Regular.woff2", weight: "400" },
    { path: "../../public/fonts/Supreme-Medium.woff2",  weight: "500" },
    { path: "../../public/fonts/Supreme-Bold.woff2",    weight: "700" },
  ],
  variable: "--font-supreme",
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

export default function RootLayout(props: { children: React.ReactNode }) {
  return (
    <html lang="fr" data-mode="light" className={supreme.variable}>
    <body>
    <JsonLd data={[organizationJsonLd(), websiteJsonLd()]} />
    <main className="relative">{props.children}</main>
    </body>
    </html>
  )
}