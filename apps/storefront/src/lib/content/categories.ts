import type { ProductFaqItem, ProductSection } from "@lib/content/products"

/**
 * Contenu éditorial des pages de CATÉGORIE — source unique, comme pour les
 * fiches (`lib/content/products.ts`, dont les règles d'écriture s'appliquent
 * ici à l'identique : aucune allégation d'origine, « personnalisé » toujours
 * qualifié, gravure jamais en tête).
 *
 * POURQUOI des catégories alors qu'il n'y a qu'une référence par famille.
 * « baguettes japonaises » (400/mois) et « éventail japonais » (185) sont des
 * requêtes LARGES : on compare avant d'acheter. Une fiche produit y répond mal,
 * une page qui explique et oriente y répond bien. Les fiches gardent les
 * requêtes transactionnelles — d'où deux intentions distinctes, et non deux
 * pages qui se disputent la même.
 *
 * La navigation principale continue de pointer sur les fiches (décision du
 * 2026-08-23) : ces pages sont atteintes par le fil d'Ariane et le pied de page.
 */

export type CategoryEditorial = {
  /** 46–51 caractères : le gabarit `%s | Hinaso` porte le total à 55–60. */
  seoTitle: string
  /** 140–155 caractères. */
  seoDescription: string
  /** Mot-clé cible du corpus. `null` si aucun ne lui est assigné. */
  targetKeyword: string | null
  /**
   * Mots-clés secondaires assumés sur la page.
   *
   * Le brief déconseille d'optimiser une page sur deux requêtes. Exception
   * tranchée le 2026-09-02 pour « art de la table japonais » (90) : le champ
   * couvre la table, donc les baguettes seules — lui dédier une catégorie
   * parente qui ne contiendrait qu'une référence dupliquerait purement la
   * catégorie baguettes. Les deux requêtes ne sont pas concurrentes mais
   * emboîtées (une famille de produits, un champ thématique plus large).
   */
  secondaryKeywords?: string[]
  /**
   * `true` → `noindex, follow`.
   *
   * Réservé aux catégories sans mot-clé assigné dont le contenu recouperait
   * celui d'une fiche à fort enjeu. Le `follow` conserve la circulation du
   * maillage : la page ne se positionne pas, mais transmet toujours.
   */
  noindex?: boolean
  sections: ProductSection[]
  faq: ProductFaqItem[]
}

export const CATEGORY_EDITORIAL: Record<string, CategoryEditorial> = {
  "baguettes-japonaises": {
    // Se distingue volontairement du title de la fiche (« Baguettes japonaises
    // personnalisées à configurer ») : ici on oriente, là on vend.
    seoTitle: "Baguettes japonaises : comment choisir les vôtres",
    seoDescription:
      "Longueur, matière, finition : ce qui distingue vraiment une paire de baguettes japonaises, et comment configurer les vôtres avant de commander.",
    targetKeyword: "baguettes japonaises",
    secondaryKeywords: ["art de la table japonais"],
    sections: [
      {
        heading: "Ce qui distingue une paire de baguettes japonaises",
        paragraphs: [
          "Les baguettes japonaises se reconnaissent à leur pointe : plus fine et plus effilée que celle des baguettes chinoises, souvent plus courtes aussi. Ce détail n'est pas décoratif — il change la prise, et donc ce qu'on peut attraper avec.",
          "Le reste tient à la finition. Un bois brut accroche, un bois laqué glisse ; une teinte sombre marque moins les traces d'usage qu'un bois clair. Ce sont ces arbitrages, plus que la forme, qui font qu'une paire se garde ou finit au fond d'un tiroir.",
        ],
      },
      {
        heading: "Choisies dans un catalogue, pas subies",
        paragraphs: [
          "La plupart des baguettes se vendent dans une finition unique, décidée avant vous. Notre parti pris est l'inverse : la couleur et la teinte du bois se choisissent au moment de la commande, et le rendu 3D montre la paire avant qu'elle ne soit fabriquée.",
          "Cinq couleurs, cinq teintes de bois, et la gravure en option pour un prénom ou une date. Le catalogue est fermé — c'est ce qui permet de garantir que la pièce livrée ressemble à l'aperçu.",
          "Sur une table dressée à la japonaise, les baguettes sont l'élément qu'on manipule le plus longtemps. C'est aussi le seul qui porte une marque personnelle sans dénaturer l'ensemble.",
        ],
      },
      {
        heading: "Conception et fabrication",
        paragraphs: [
          "Ces baguettes sont de style japonais par la forme et l'usage. Elles sont conçues et fabriquées en France : ni le bois ni le façonnage ne viennent du Japon. Nous l'écrivons plutôt que de laisser planer un doute que d'autres entretiennent.",
        ],
      },
    ],
    faq: [
      {
        // Répond à « ou acheter des baguettes japonaises » (36/mois), que le
        // corpus assigne explicitement à la FAQ de cette catégorie.
        question: "Où acheter des baguettes japonaises ?",
        answer:
          "En épicerie asiatique et en grande surface pour les modèles d'entrée de gamme, en boutique d'arts de la table pour les paires travaillées, et en ligne pour tout ce qui se configure. Ici, vous choisissez la couleur, la teinte et la gravure avant fabrication.",
      },
      {
        question: "Quelle longueur choisir ?",
        answer:
          "Les baguettes japonaises sont traditionnellement plus courtes que les chinoises, et se déclinent par taille de main. Nous ne proposons qu'une longueur, pensée pour un usage adulte courant.",
      },
      {
        question: "Faut-il un repose-baguettes ?",
        answer:
          "Non, ce n'est pas obligatoire — mais poser les baguettes en travers du bol est mal vu à table. Un repose-baguettes, ou le bord d'une assiette, suffit.",
      },
      {
        question: "Ces baguettes sont-elles importées du Japon ?",
        answer:
          "Non. Elles sont de style japonais, conçues et fabriquées en France. Aucune matière ni aucune étape de fabrication n'est japonaise.",
      },
    ],
  },

  "eventail-japonais": {
    seoTitle: "Éventail japonais : comment choisir et configurer",
    seoDescription:
      "Pliant ou rigide, papier ou tissu, monture claire ou sombre : ce qui différencie les éventails japonais, et comment composer le vôtre en 3D.",
    targetKeyword: "éventail japonais",
    sections: [
      {
        heading: "Pliant ou rigide : deux objets différents",
        paragraphs: [
          "Un éventail japonais pliant se replie sur sa monture et tient dans une poche : c'est celui qu'on emporte. Le modèle rigide, d'une seule pièce, ne se plie pas — il brasse plus d'air mais s'encombre.",
          "Le choix se fait donc moins sur l'esthétique que sur l'usage : transporter, ou ventiler. Nous ne proposons que le pliant.",
        ],
      },
      {
        heading: "Ce qui change vraiment d'un modèle à l'autre",
        paragraphs: [
          "La monture d'abord : une teinte claire allège l'objet, une teinte sombre le densifie. Le papier ensuite, dont la couleur porte l'essentiel de l'effet. Le motif enfin, qui peut tout changer — ou être absent, si l'on préfère un aplat uni.",
          "Reste un détail qu'on regarde rarement en boutique et qui saute aux yeux une fois l'objet en main : la finition des vis d'assemblage. Or, argent, bronze ou noir, c'est ce qui fait basculer un éventail du discret au démonstratif.",
          "Ces quatre axes se combinent dans le configurateur, et le modèle 3D se met à jour à chaque choix. Le catalogue est volontairement fermé : c'est la condition pour que l'aperçu corresponde à la pièce livrée.",
        ],
      },
      {
        heading: "Conception et fabrication",
        paragraphs: [
          "Nos éventails sont de style japonais par la forme et le mécanisme. Ils sont conçus et fabriqués en France : ni la monture, ni le papier, ni l'assemblage ne viennent du Japon.",
        ],
      },
    ],
    faq: [
      {
        question: "Un éventail japonais se répare-t-il ?",
        answer:
          "Une lame de monture cassée se remplace difficilement sans démonter l'ensemble. Le papier déchiré, lui, condamne en général l'objet — d'où l'intérêt d'une monture solide dès le départ.",
      },
      {
        question: "Comment le ranger sans l'abîmer ?",
        answer:
          "Replié, à plat, à l'abri de l'humidité. Le laisser ouvert en permanence fatigue le pli du papier et finit par le marquer.",
      },
      {
        question: "Peut-on offrir un éventail japonais ?",
        answer:
          "Oui, et la gravure en option permet d'y porter un prénom ou une date. C'est un objet plat et léger, facile à expédier ou à glisser dans un paquet.",
      },
      {
        question: "Vos éventails viennent-ils du Japon ?",
        answer:
          "Non. Ils sont de style japonais, mais conçus et fabriqués en France. Nous ne revendiquons ni origine ni savoir-faire japonais.",
      },
    ],
  },

  "ombrelle-japonaise": {
    // ⚠️ AUCUN mot-clé, et `noindex` assumé. « ombrelle japonaise » (1 000/mois)
    // est le mot-clé le plus fort du corpus et appartient à la FICHE. Une
    // catégorie qui liste cette unique référence n'aurait rien à gagner et
    // ferait concurrence à la page qu'elle alimente. Elle existe pour la
    // cohérence du fil d'Ariane, et le `follow` laisse circuler le maillage.
    // À réindexer le jour où la famille comptera plusieurs références.
    seoTitle: "Ombrelles japonaises à configurer",
    seoDescription:
      "Nos ombrelles de style japonais, à configurer en 3D : couleur, toile et gravure du manche au choix. Conçues et fabriquées en France.",
    targetKeyword: null,
    noindex: true,
    sections: [
      {
        heading: "Une seule référence, entièrement configurable",
        paragraphs: [
          "Cette famille ne compte qu'un modèle pour l'instant, décliné par la couleur, la toile et la gravure du manche. Le rendu 3D montre la combinaison avant fabrication.",
          "Conçue et fabriquée en France : ni la toile, ni la monture, ni le montage ne sont japonais. Seul le style l'est.",
        ],
      },
    ],
    faq: [],
  },
}

/** Contenu éditorial d'une catégorie, ou `null` si elle n'en a pas. */
export function getCategoryEditorial(
  handle: string | undefined
): CategoryEditorial | null {
  if (!handle) return null
  return CATEGORY_EDITORIAL[handle] ?? null
}
