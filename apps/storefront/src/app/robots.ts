import { MetadataRoute } from "next"
import { absoluteUrl } from "@lib/util/seo"

/**
 * robots.txt natif (Next Metadata route) → servi sur /robots.txt.
 *
 * URL du sitemap et host dérivés de `NEXT_PUBLIC_BASE_URL` (via absoluteUrl) :
 * bascule vers hinaso.fr = une seule variable d'env à changer.
 *
 * Les routes sont préfixées par le pays (/fr/…, /dk/…), d'où les motifs à
 * joker avec un segment pays en tête. Les pages privées/transactionnelles
 * (compte, panier, tunnel de commande, commandes) sont exclues du crawl —
 * elles portent déjà noindex.
 */
export default function robots(): MetadataRoute.Robots {
  const origin = new URL(absoluteUrl("/")).origin

  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: [
          "/*/account",
          "/*/cart",
          "/*/checkout",
          "/*/order/",
        ],
      },
    ],
    sitemap: absoluteUrl("/sitemap.xml"),
    host: origin,
  }
}
