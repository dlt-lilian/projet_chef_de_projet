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
 *
 * `DISABLE_INDEXING=true` (site de démo) : tout le crawl est interdit, pour que
 * les robots ne réveillent plus les services mis en veille sur Railway. Lu au
 * build, comme le reste de cette route statique.
 */
export default function robots(): MetadataRoute.Robots {
  if (process.env.DISABLE_INDEXING === "true") {
    return { rules: [{ userAgent: "*", disallow: "/" }] }
  }

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
