/**
 * Métadonnées SEO des pages de CATÉGORIE.
 *
 * ⚠️ Ce module ne contient PLUS de contenu éditorial. Le 2026-09-08, les
 * sections et les FAQ qui vivaient ici ont été déplacées vers le blog :
 *
 *   baguettes-japonaises → /blog/choisir-ses-baguettes-japonaises
 *   eventail-japonais    → /blog/choisir-son-eventail-japonais
 *   ombrelle-japonaise   → déjà couvert par /blog/wagasa-ombrelle-japonaise
 *
 * POURQUOI CE DÉPLACEMENT. Les pages de catégorie étaient atteintes par le
 * pied de page, seul maillage qu'elles avaient — la navbar pointant sur les
 * fiches (décision du 2026-08-23). Ce maillage a été retiré : un pied de page
 * qui répète trois ancres quasi exactes sur chaque page du site est le signal
 * de sur-optimisation le plus facile à détecter, et il envoyait le jus vers
 * des listings d'UNE référence plutôt que vers les fiches qui convertissent.
 *
 * Le contenu, lui, n'avait rien à voir avec un listing : il expliquait, il
 * comparait, il répondait à des questions. C'est un article, pas une page de
 * catalogue. Il est donc parti au blog, où il se maille avec les articles
 * existants et vit sa propre vie éditoriale (backoffice, dates, catégories).
 *
 * CE QUI RESTE ICI. Un `title` et une `description` calibrés — meilleurs que
 * le nom brut de la catégorie pour l'onglet et les aperçus de lien — et le
 * drapeau `noindex`.
 *
 * TOUTES LES CATÉGORIES SONT DÉSORMAIS EN `noindex, follow`. Sans éditorial,
 * chacune n'affiche qu'un produit : c'est une page mince, qui ferait de la
 * concurrence à la fiche qu'elle liste. Le `follow` conserve la circulation du
 * maillage — la page ne se positionne pas, mais transmet toujours vers la
 * fiche. Elles restent servies parce que le fil d'Ariane des fiches produit
 * pointe dessus, et parce que des articles déjà publiés les lient.
 *
 * À REBASCULER EN INDEX le jour où une famille comptera plusieurs références :
 * la page redeviendra alors un vrai comparateur, et non un doublon de fiche.
 */

export type CategorySeo = {
  /** 46–51 caractères : le gabarit `%s | Hinaso` porte le total à 55–60. */
  seoTitle: string
  /** 140–155 caractères. */
  seoDescription: string
  /**
   * Article de blog qui porte le contenu éditorial de cette famille.
   *
   * Purement documentaire : rien ne le lit au rendu. Il existe pour qu'une
   * relecture six mois plus tard sache où est passé le texte, sans avoir à
   * remonter l'historique git.
   */
  movedTo: string
  /**
   * `true` → `robots: noindex, follow`, et la catégorie sort du sitemap.
   *
   * Les deux vont ensemble : lister au sitemap une URL qu'on demande de ne
   * pas indexer envoie deux consignes contradictoires au crawl.
   */
  noindex: boolean
}

export const CATEGORY_SEO: Record<string, CategorySeo> = {
  "baguettes-japonaises": {
    seoTitle: "Baguettes japonaises à configurer",
    seoDescription:
      "Nos baguettes de style japonais, à configurer en 3D : couleur, teinte du bois et gravure au choix. Conçues et fabriquées en France.",
    movedTo: "/blog/choisir-ses-baguettes-japonaises",
    noindex: true,
  },

  "eventail-japonais": {
    seoTitle: "Éventails japonais à configurer",
    seoDescription:
      "Nos éventails pliants de style japonais, à configurer en 3D : monture, papier, motif et finitions au choix. Conçus et fabriqués en France.",
    movedTo: "/blog/choisir-son-eventail-japonais",
    noindex: true,
  },

  "ombrelle-japonaise": {
    seoTitle: "Ombrelles japonaises à configurer",
    seoDescription:
      "Nos ombrelles de style japonais, à configurer en 3D : couleur, toile et gravure du manche au choix. Conçues et fabriquées en France.",
    // Pas d'article dédié : les deux paragraphes de cette catégorie disaient
    // déjà, en plus court, ce que dit la section finale de l'article wagasa
    // (« Ce que nous fabriquons — et ce que non »). Les recopier aurait créé
    // un doublon interne au lieu d'un contenu.
    movedTo: "/blog/wagasa-ombrelle-japonaise",
    noindex: true,
  },
}

/** Métadonnées SEO d'une catégorie, ou `null` si elle n'en a pas. */
export function getCategorySeo(handle: string | undefined): CategorySeo | null {
  if (!handle) return null
  return CATEGORY_SEO[handle] ?? null
}

/** Handles servis en `noindex` — lus par le sitemap pour les en exclure. */
export const NOINDEX_CATEGORY_HANDLES = new Set(
  Object.entries(CATEGORY_SEO)
    .filter(([, seo]) => seo.noindex)
    .map(([handle]) => handle)
)
