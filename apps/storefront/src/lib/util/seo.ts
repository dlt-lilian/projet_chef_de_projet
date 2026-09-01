import { getBaseURL } from "@lib/util/env"

/**
 * Source unique de vérité SEO (marque, langue, URL de base, données structurées).
 *
 * URL de base : tout est dérivé de `NEXT_PUBLIC_BASE_URL` via `getBaseURL()`.
 * En prod (Railway) il faut la régler sur le domaine réel
 * (`https://hinaso.up.railway.app` aujourd'hui, `https://hinaso.fr` demain) —
 * le jour de la bascule, seule cette variable change, jamais le code.
 */

/**
 * ⚠️ RÈGLE D'ÉCRITURE — à respecter dans TOUT texte public du site.
 *
 * 1. ORIGINE. Les produits sont de STYLE japonais mais sont CONÇUS ET FABRIQUÉS
 *    EN FRANCE. Aucune formulation ne doit suggérer une origine, une matière ou
 *    un savoir-faire japonais : « artisanat japonais », « authentique »,
 *    « matériaux sélectionnés au Japon », « tradition Kōgei »… sont des
 *    allégations d'origine fausses (exposition juridique) et détruisent
 *    l'argument différenciant. « japonais » reste légitime comme DESCRIPTEUR DE
 *    PRODUIT (« baguettes japonaises ») : c'est ce que cherchent les visiteurs.
 *    Il devient faux dès qu'il qualifie la fabrication ou la matière.
 *
 * 2. AMBIGUÏTÉ. « personnalisé » seul désigne le plus souvent, dans cette
 *    niche, un motif imprimé : toujours l'accompagner d'un mot qui tranche —
 *    « sur-mesure », « que vous configurez », « à configurer en 3D ».
 *    « configurer » plutôt que « composer » : c'est le verbe que les acheteurs
 *    français associent déjà à ce mécanisme (configurateur auto, de cuisine).
 *    Et jamais « créer de zéro » : le configurateur offre 5 teintes, 5 couleurs,
 *    3 motifs, 4 finitions — c'est un choix dans un catalogue. Promettre la
 *    création ex nihilo serait démenti dès l'ouverture de la fiche produit.
 *
 * 3. HIÉRARCHIE. La promesse centrale est le CONFIGURATEUR : couleur, teinte,
 *    toile, papier, motif, finitions, vus en 3D. La gravure n'est QU'UNE option
 *    parmi trois à cinq, facturée en supplément et placée en dernier dans
 *    chaque produit — ne jamais l'installer en tête d'un titre ni d'un H1.
 */
export const SITE_NAME = "Hinaso"
export const SITE_TAGLINE = "Accessoires japonais à configurer en 3D"

/**
 * Titre par défaut (accueil / pages sans titre propre). Ne reçoit PAS le suffixe.
 * 59 caractères ; « sur-mesure » démarre au 30e — donc encore visible sur mobile,
 * où l'affichage est tronqué autour du 40e.
 *
 * L'accueil ne porte aucun mot-clé du corpus (aucun ne lui est assigné) : il
 * vend la marque et le mécanisme, pas une requête. Y empiler « baguettes
 * japonaises » et consorts cannibaliserait les fiches produit.
 */
export const SITE_DEFAULT_TITLE =
  "Hinaso — accessoires japonais sur-mesure à configurer en 3D"

/** Gabarit appliqué aux titres de page : « Ma page » → « Ma page | Hinaso ». */
export const SITE_TITLE_TEMPLATE = "%s | Hinaso"

/** 152 caractères. Ouvre sur ce que le visiteur FAIT, pas sur ce que le site est. */
export const SITE_DEFAULT_DESCRIPTION =
  "Choisissez l'essence, la couleur, le motif et voyez la pièce en 3D avant de commander. Baguettes, éventails et ombrelles japonaises fabriqués en France."

/** Locale OpenGraph (le contenu du site est actuellement en français). */
export const OG_LOCALE = "fr_FR"

/**
 * Marché prioritaire. Source unique pour DEUX choses qui doivent coïncider :
 * le `x-default` du cluster hreflang (plus bas) et le pays servi par défaut
 * par le middleware quand l'URL n'en porte aucun.
 */
export const PRIMARY_COUNTRY = "fr"

/** Base sans slash final, pour composer des URLs absolues (JSON-LD, sameAs…). */
function baseUrl(): string {
  return getBaseURL().replace(/\/+$/, "")
}

/** URL absolue à partir d'un chemin (`/fr/store` → `https://…/fr/store`). */
export function absoluteUrl(path = "/"): string {
  const p = path.startsWith("/") ? path : `/${path}`
  return `${baseUrl()}${p}`
}

/**
 * Chemin canonique auto-référent d'une page, préfixé par le pays.
 * Renvoie un chemin relatif (« /fr/products/x ») : Next.js le résout contre
 * `metadataBase`, ce qui garde le domaine 100 % piloté par l'environnement.
 */
export function canonicalPath(countryCode: string, subPath = ""): string {
  const clean = subPath ? (subPath.startsWith("/") ? subPath : `/${subPath}`) : ""
  return `/${countryCode}${clean}`
}

/* -------------------------------------------------------------------------- */
/*  hreflang — géo-ciblage multi-pays (une seule langue : le français)        */
/* -------------------------------------------------------------------------- */

/**
 * Pays actifs (région Medusa « Europe »), routés via [countryCode] : c'est la
 * liste qui compose le cluster hreflang.
 * ⚠️ À garder synchro avec les pays configurés dans l'admin Medusa. Le sitemap,
 * lui, dérive les pays du backend au runtime — les deux doivent coïncider
 * (7 pays aujourd'hui).
 */
export const HREFLANG_COUNTRIES = [
  "fr",
  "de",
  "es",
  "it",
  "gb",
  "dk",
  "se",
] as const

/**
 * Pays → étiquette locale BCP 47, source unique pour hreflang ET <html lang>.
 *
 * Contenu UNIFORME EN FRANÇAIS aujourd'hui → géo-ciblage : même langue `fr`,
 * une région par pays (`fr-DE` = « français, ciblé Allemagne »). Ce n'est PAS
 * un faux multilingue : on ne prétend jamais que /de est rédigé en allemand.
 *
 * Roadmap traduction (fr, de, en) : quand le contenu traduit d'un pays sera en
 * ligne, basculer SA ligne ici — ex. `de: "de-DE"`, `gb: "en-GB"` — et hreflang
 * comme <html lang> suivront automatiquement. Une ligne à changer par pays.
 */
const COUNTRY_LOCALE: Record<string, string> = {
  fr: "fr-FR",
  de: "fr-DE",
  es: "fr-ES",
  it: "fr-IT",
  gb: "fr-GB",
  dk: "fr-DK",
  se: "fr-SE",
}

/** Étiquette locale BCP 47 d'un pays (hreflang, <html lang>). Repli : marché prioritaire. */
export function localeForCountry(countryCode?: string): string {
  return (
    COUNTRY_LOCALE[(countryCode || "").toLowerCase()] ??
    COUNTRY_LOCALE[PRIMARY_COUNTRY]
  )
}

/**
 * Map `alternates.languages` (Next Metadata) = cluster hreflang géo-ciblage.
 *
 * Une entrée par pays actif (`fr-FR`, `fr-DE`, …) + un `x-default` pointant sur
 * le marché prioritaire (France). Chemins RELATIFS, résolus par Next contre
 * `metadataBase` — domaine 100 % piloté par l'environnement, comme le canonical.
 *
 * @param subPath sous-chemin après le pays (« /products/x », « /store », « »).
 */
export function hreflangAlternates(subPath = ""): Record<string, string> {
  const languages: Record<string, string> = {}
  for (const cc of HREFLANG_COUNTRIES) {
    languages[localeForCountry(cc)] = canonicalPath(cc, subPath)
  }
  languages["x-default"] = canonicalPath(PRIMARY_COUNTRY, subPath)
  return languages
}

/* -------------------------------------------------------------------------- */
/*  Données structurées (JSON-LD Schema.org)                                  */
/* -------------------------------------------------------------------------- */

type JsonLd = Record<string, unknown>

/** Organisation — identité de marque, rendue une fois au layout racine. */
export function organizationJsonLd(): JsonLd {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: SITE_NAME,
    url: baseUrl(),
    logo: absoluteUrl("/Hinaso.svg"),
    description: SITE_DEFAULT_DESCRIPTION,
    // TODO: renseigner les vrais profils sociaux (le footer pointe vers des
    // URLs génériques instagram.com/… — ne pas les déclarer en sameAs tant
    // qu'elles ne sont pas les vrais comptes Hinaso).
  }
}

/** WebSite — nom du site pour le sitelinks box de Google. */
export function websiteJsonLd(): JsonLd {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: SITE_NAME,
    url: baseUrl(),
    inLanguage: "fr-FR",
    // NB: pas de `potentialAction`/SearchAction : il n'existe pas encore de page
    // de recherche interne. À ajouter le jour où une route /search existe.
  }
}

/** Fil d'Ariane. `items` du plus général au plus précis. */
export function breadcrumbJsonLd(
  items: { name: string; path: string }[]
): JsonLd {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((it, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: it.name,
      item: absoluteUrl(it.path),
    })),
  }
}

/**
 * WebPage — page éditoriale autonome (mentions légales, CGV…). Volontairement
 * pas un `BlogPosting` : ces pages n'ont ni auteur ni date de publication qui
 * fassent sens pour un moteur de recherche.
 */
export function webPageJsonLd(input: {
  title: string
  description?: string | null
  path: string
}): JsonLd {
  return {
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: input.title,
    description: input.description || undefined,
    url: absoluteUrl(input.path),
    inLanguage: "fr-FR",
    isPartOf: { "@type": "WebSite", name: SITE_NAME, url: baseUrl() },
  }
}

/** Liste d'items (pages listing : store, catégories, collections). */
export function itemListJsonLd(
  items: { name: string; path: string }[]
): JsonLd {
  return {
    "@context": "https://schema.org",
    "@type": "ItemList",
    numberOfItems: items.length,
    itemListElement: items.map((it, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: it.name,
      url: absoluteUrl(it.path),
    })),
  }
}

/** Date de fin de validité de prix (Google recommande de la fournir sur les Offer). */
export function priceValidUntil(monthsAhead = 12): string {
  const d = new Date()
  d.setMonth(d.getMonth() + monthsAhead)
  return d.toISOString().split("T")[0]
}

type ProductJsonLdInput = {
  name: string
  description?: string | null
  images?: (string | undefined | null)[] | null
  sku?: string | null
  path: string
  price?: number | null
  currency?: string | null
  availability: "InStock" | "OutOfStock"
}

/** Product + Offer — rich result e-commerce. */
export function productJsonLd(input: ProductJsonLdInput): JsonLd {
  const images = (input.images ?? []).filter(Boolean) as string[]
  const offers: JsonLd = {
    "@type": "Offer",
    priceCurrency: (input.currency ?? "EUR").toUpperCase(),
    availability: `https://schema.org/${input.availability}`,
    itemCondition: "https://schema.org/NewCondition",
    url: absoluteUrl(input.path),
    seller: { "@type": "Organization", name: SITE_NAME },
  }
  if (input.price != null) {
    offers.price = input.price.toFixed(2)
    offers.priceValidUntil = priceValidUntil()
  }

  return {
    "@context": "https://schema.org",
    "@type": "Product",
    name: input.name,
    description: input.description || input.name,
    image: images.length ? images : undefined,
    sku: input.sku || undefined,
    brand: { "@type": "Brand", name: SITE_NAME },
    url: absoluteUrl(input.path),
    offers,
  }
}

type BlogPostingInput = {
  title: string
  description?: string | null
  image?: string | null
  path: string
  author?: string | null
  datePublished?: string | null
}

/** BlogPosting — article de blog. */
export function blogPostingJsonLd(input: BlogPostingInput): JsonLd {
  return {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: input.title,
    description: input.description || undefined,
    image: input.image || undefined,
    url: absoluteUrl(input.path),
    inLanguage: "fr-FR",
    datePublished: input.datePublished || undefined,
    author: input.author
      ? { "@type": "Person", name: input.author }
      : { "@type": "Organization", name: SITE_NAME },
    publisher: {
      "@type": "Organization",
      name: SITE_NAME,
      logo: { "@type": "ImageObject", url: absoluteUrl("/Hinaso.svg") },
    },
  }
}
