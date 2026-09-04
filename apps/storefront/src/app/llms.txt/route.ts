import { HttpTypes } from "@medusajs/types"
import { getAllArticles, getAllPages } from "@lib/blog"
import { OCCASION_LANDINGS } from "@lib/content/occasions"
import {
  PRIMARY_COUNTRY,
  SITE_DEFAULT_DESCRIPTION,
  SITE_NAME,
  SITE_TAGLINE,
  absoluteUrl,
} from "@lib/util/seo"

/**
 * llms.txt (spec llmstxt.org) → servi sur /llms.txt.
 *
 * Pourquoi une route et pas un fichier dans `public/` : le contenu doit rester
 * aligné sur le catalogue et le blog, tous deux pilotés depuis l'admin. Un
 * fichier figé mentirait dès la première publication d'article.
 *
 * Pourquoi ce dossier littéral `llms.txt/` : en Next, un segment statique
 * l'emporte sur un segment dynamique. Sans lui, `/llms.txt` tombait dans
 * `app/[countryCode]` — le point dans le chemin fait sortir le middleware très
 * tôt (`pathname.includes(".")`), « llms.txt » était donc pris pour un code
 * pays et l'ACCUEIL était rendu en 200. C'est ce que l'audit voyait : du HTML
 * là où il attendait du Markdown, donc « en-tête H1 manquant ».
 *
 * `force-dynamic` pour la même raison que sitemap.ts : sur Railway le
 * conteneur de BUILD n'atteint pas le backend de façon fiable, un rendu au
 * build figerait un fichier vide.
 *
 * Structure imposée par la spec : un H1 (obligatoire), une citation de résumé,
 * du texte libre, puis des sections H2 ne contenant QUE des listes de liens —
 * le fichier doit se terminer sur l'une d'elles.
 */

export const dynamic = "force-dynamic"

const BACKEND_URL = (
  process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL ?? "http://localhost:9000"
).replace(/\/+$/, "")
const PUBLISHABLE_KEY = process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY ?? ""

/** Même stratégie de réessai que le sitemap : couvre le cold-boot du backend. */
async function fetchStore<T>(path: string, attempts = 3): Promise<T | null> {
  for (let attempt = 1; attempt <= attempts; attempt++) {
    try {
      const res = await fetch(`${BACKEND_URL}${path}`, {
        headers: { "x-publishable-api-key": PUBLISHABLE_KEY },
        cache: "no-store",
      })
      if (res.ok) return (await res.json()) as T
    } catch {
      // réseau / backend en cold-boot → on réessaie
    }
    if (attempt < attempts) {
      await new Promise((r) => setTimeout(r, 600 * attempt))
    }
  }
  return null
}

/**
 * Neutralise ce qui casserait un lien Markdown. Les titres et descriptions
 * viennent de l'admin : un `]` dans un titre d'article tronquerait le libellé
 * du lien, un retour à la ligne couperait l'élément de liste en deux.
 */
function inline(text: string | null | undefined, max = 160): string {
  if (!text) return ""
  const flat = text
    .replace(/\s+/g, " ")
    .replace(/[[\]]/g, "")
    .trim()
  return flat.length > max ? `${flat.slice(0, max - 1).trimEnd()}…` : flat
}

/** `- [libellé](url) : notes` — la forme de liste attendue par la spec. */
function link(label: string, path: string, notes?: string | null): string {
  const suffix = notes ? ` : ${inline(notes)}` : ""
  return `- [${inline(label, 120)}](${absoluteUrl(path)})${suffix}`
}

export async function GET(): Promise<Response> {
  const cc = PRIMARY_COUNTRY

  const [productsData, articles, pages] = await Promise.all([
    fetchStore<{ products: HttpTypes.StoreProduct[] }>(
      "/store/products?fields=handle,title,subtitle,description&limit=100"
    ),
    getAllArticles().catch(() => []),
    getAllPages().catch(() => []),
  ])

  const products = productsData?.products ?? []

  const sections: string[] = []

  // H1 + résumé : le minimum exigé par la spec, et la seule partie qui ne
  // dépend d'aucun appel réseau — le fichier reste valide backend éteint.
  sections.push(`# ${SITE_NAME}`)
  sections.push(`> ${SITE_TAGLINE}. ${SITE_DEFAULT_DESCRIPTION}`)
  sections.push(
    [
      `${SITE_NAME} conçoit et fabrique en France des accessoires d'inspiration`,
      `japonaise — baguettes, éventails et ombrelles. Chaque pièce se personnalise`,
      `avant commande dans un configurateur 3D (essence, couleur, motif, finitions),`,
      `et le rendu affiché correspond à l'objet livré.`,
      ``,
      `Les URL sont préfixées par un code pays (\`/${cc}/…\`) ; les liens ci-dessous`,
      `pointent vers la version française du site.`,
    ].join("\n")
  )

  if (products.length) {
    sections.push(
      [
        "## Produits",
        ...products
          .filter((p) => p.handle)
          .map((p) =>
            link(
              p.title ?? p.handle!,
              `/${cc}/products/${p.handle}`,
              p.subtitle ?? p.description
            )
          ),
      ].join("\n")
    )
  }

  sections.push(
    [
      "## Parcourir la boutique",
      link("Boutique", `/${cc}/store`, "Tous les produits disponibles"),
      link("Offrir", `/${cc}/offrir`, "Idées cadeaux par occasion"),
      // `breadcrumbLabel` est le nom court prévu pour les ancres de maillage —
      // exactement le registre attendu pour un libellé de lien, là où `h1` et
      // `seoTitle` sont des phrases complètes.
      ...OCCASION_LANDINGS.map((o) =>
        link(o.breadcrumbLabel, `/${cc}/offrir/${o.slug}`, o.seoDescription)
      ),
    ].join("\n")
  )

  if (articles.length) {
    sections.push(
      [
        "## Blog",
        link("Tous les articles", `/${cc}/blog`, "Guides et repères culturels"),
        ...articles
          .filter((a) => a.slug)
          .map((a) => link(a.title, `/${cc}/blog/${a.slug}`, a.excerpt)),
      ].join("\n")
    )
  }

  // « Optional » a un sens précis dans la spec : sections qu'un agent peut
  // ignorer s'il manque de contexte. C'est aussi la dernière section, ce qui
  // satisfait l'exigence « le fichier se termine par une liste de liens ».
  sections.push(
    [
      "## Optional",
      link("Contact", `/${cc}/contact`, "Formulaire et assistance"),
      link("Gestion des cookies", `/${cc}/cookies`),
      ...pages
        .filter((p) => p.path)
        .map((p) => link(p.title, `/${cc}/${p.path}`)),
    ].join("\n")
  )

  return new Response(`${sections.join("\n\n")}\n`, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "public, max-age=0, s-maxage=3600, must-revalidate",
    },
  })
}
