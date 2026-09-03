import type { ProductFaqItem, ProductSection } from "@lib/content/products"

/**
 * Landings d'occasion — le gisement principal du corpus (9 313 recherches
 * mensuelles cumulées, contre 2 091 pour tout le catalogue).
 *
 * ─── SIX PAGES POUR NEUF MOTS-CLÉS ───────────────────────────────────────
 * Le corpus liste neuf requêtes mais ne décrit que six intentions :
 *   · « cadeau personnalisé papa » (2 000), « pour papa » (1 300) et « fête des
 *     pères » (880) sont la même recherche formulée trois fois. Trois pages
 *     distinctes se disputeraient le cluster le plus lourd du site.
 *   · « Saint-Valentin pour homme » (590) est un sous-ensemble de
 *     « Saint-Valentin » (1 600) : une section suffit, pas une page.
 * Les requêtes regroupées vivent dans `secondaryKeywords` — elles sont servies
 * par la même page, non ignorées.
 *
 * ─── LE RISQUE ICI N'EST PAS LA CANNIBALISATION ──────────────────────────
 * Six landings pointant vers un catalogue de trois articles, c'est la
 * définition d'une page satellite (doorway page) chez Google. Chaque page a
 * donc un angle, une objection et une FAQ qui lui sont propres. Si deux d'entre
 * elles deviennent interchangeables au fil des retouches, elles ne méritent
 * plus d'exister séparément.
 *
 * Règles d'écriture : voir l'en-tête de `lib/content/products.ts`.
 * « cadeau personnalisé » seul est explicitement HORS corpus — il n'est jamais
 * ciblé nu, toujours qualifié par son occasion.
 */

export type OccasionLanding = {
  /** Segment d'URL : /{pays}/offrir/{slug}. */
  slug: string
  /** 46–51 caractères ; le gabarit `%s | Hinaso` porte le total à 55–60. */
  seoTitle: string
  /** 140–155 caractères. */
  seoDescription: string
  /** Mot-clé cible principal (corpus validé). */
  targetKeyword: string
  /** Requêtes de même intention servies par cette page. */
  secondaryKeywords: string[]
  /** H1, distinct du title. */
  h1: string
  /** Nom court pour le fil d'Ariane et les ancres de maillage. */
  breadcrumbLabel: string
  intro: string[]
  sections: ProductSection[]
  /** Titre du bloc produits, propre à l'occasion. */
  productHeading: string
  faq: ProductFaqItem[]
}

/**
 * TODO — sans ces données, aucune landing ne peut porter d'argument de délai,
 * or c'est LE levier de conversion d'une page cadeau saisonnière
 * (« commandez avant le … pour recevoir avant la fête des pères ») :
 *   · délai de fabrication d'une pièce configurée
 *   · délai et transporteur d'expédition
 *   · existence d'un emballage cadeau
 * Une section « Commander à temps » s'ajoutera ici le jour où ils seront connus.
 */

export const OCCASION_LANDINGS: OccasionLanding[] = [
  {
    slug: "papa",
    seoTitle: "Cadeau personnalisé papa : à graver et configurer",
    seoDescription:
      "Un objet que votre père n'a pas déjà : baguettes, éventail ou ombrelle configurés option par option, gravés à son prénom. Fabriqués en France.",
    targetKeyword: "cadeau personnalisé papa",
    secondaryKeywords: [
      "cadeau personnalisé pour papa",
      "cadeau personnalisé fête des pères",
    ],
    h1: "Offrir à son père un objet qu'il n'a pas déjà",
    breadcrumbLabel: "Pour papa",
    intro: [
      "Le problème du cadeau pour un père, c'est rarement le budget. C'est qu'il a déjà une ceinture, un portefeuille, un coffret de bière et trois mugs à message. L'objet gravé sort de cette liste pour une raison simple : il n'existait pas avant que vous le commandiez.",
      "Attention au mot « personnalisé », qui désigne souvent un motif imprimé sur un objet de série. Ici, vous choisissez la matière, la teinte et la finition, puis vous ajoutez un texte gravé. La pièce est fabriquée après votre commande.",
    ],
    sections: [
      {
        heading: "Pourquoi un objet gravé fonctionne mieux qu'un objet cher",
        paragraphs: [
          "Un cadeau réussi n'est pas celui qui coûte le plus, c'est celui qu'on ne peut pas revendre. Un prénom gravé rend l'objet inutilisable pour quelqu'un d'autre — et c'est précisément ce qui le rend difficile à ranger dans un placard.",
          "Le texte tient sur une ligne : un prénom, une date, une phrase courte. Assez pour être personnel, assez court pour ne pas devenir une plaisanterie qu'on regrette au bout de deux ans.",
        ],
      },
      {
        heading: "Ce que vous décidez avant de commander",
        paragraphs: [
          "Chaque pièce se configure en 3D. Pour les baguettes, la couleur et la teinte du bois. Pour l'éventail, la monture, la couleur du papier, le motif et la finition des vis. Pour l'ombrelle, la couleur et la toile.",
          "Le catalogue est volontairement fermé — cinq couleurs, cinq teintes, trois motifs — parce que c'est la condition pour que l'aperçu 3D corresponde à ce qui sera livré. On ne promet pas l'infini, on promet la fidélité.",
          "Tout est conçu et fabriqué en France. Les objets sont de style japonais ; ni les matières ni le façonnage ne viennent du Japon, et nous préférons l'écrire.",
        ],
      },
    ],
    productHeading: "Trois pièces à configurer pour lui",
    faq: [
      {
        question: "Peut-on faire graver une photo ou un logo ?",
        answer:
          "Non. La gravure n'accepte que du texte, sur une ligne. C'est une contrainte du procédé, pas un choix commercial.",
      },
      {
        question: "Combien de caractères tient la gravure ?",
        answer:
          "Une ligne courte : un prénom, une date, quelques mots. Au-delà, le texte devient illisible sur des pièces de cette taille.",
      },
      {
        question: "Mon père ne se sert pas de baguettes. Est-ce un mauvais choix ?",
        answer:
          "Probablement, oui. Un objet gravé qui ne sert pas devient un bibelot. L'éventail et l'ombrelle s'adressent à d'autres usages — regardez ce qu'il utilise vraiment avant de choisir.",
      },
      {
        question: "La gravure est-elle comprise dans le prix ?",
        answer:
          "Non, c'est une option facturée en supplément, ajoutée seulement si vous saisissez un texte. Les prix affichés sont ceux des pièces sans gravure.",
      },
    ],
  },

  {
    slug: "saint-valentin",
    seoTitle: "Cadeau personnalisé Saint-Valentin à configurer",
    seoDescription:
      "Sortez du bouquet et du coffret : une pièce configurée option par option et gravée, choisie pour une personne précise. Conçue et fabriquée en France.",
    targetKeyword: "cadeau personnalisé Saint-Valentin",
    secondaryKeywords: ["cadeau personnalisé Saint-Valentin pour homme"],
    h1: "Un cadeau de Saint-Valentin qui ne ressemble à aucun autre",
    breadcrumbLabel: "Saint-Valentin",
    intro: [
      "La Saint-Valentin a un défaut : tout le monde achète au même endroit, la même semaine. Le bouquet, le coffret, la bougie parfumée. L'objet configuré échappe à cette mécanique parce qu'il n'existe qu'en un exemplaire, celui que vous avez composé.",
      "« Personnalisé » ne veut pas dire ici un cœur imprimé sur un objet de série. Cela veut dire que vous fixez la teinte, la matière et la finition, puis que vous ajoutez un texte gravé.",
    ],
    sections: [
      {
        heading: "Pour un homme, quand la liste habituelle ne donne rien",
        paragraphs: [
          "Les rayons Saint-Valentin masculins tournent autour de trois idées : l'alcool, le rasage, le cuir. Un objet gravé change de registre — il ne suppose rien sur les goûts, il porte simplement une trace de vous.",
          "Les baguettes en teinte sombre, noyer ou ébène, avec les vis noires de l'éventail, composent un ensemble discret. C'est le contraire du cadeau qui crie ce qu'il est.",
        ],
      },
      {
        heading: "Ce que le configurateur montre — et ce qu'il ne montre pas",
        paragraphs: [
          "Le modèle 3D affiche fidèlement la couleur, la teinte et la matière : c'est ce que vous verrez arriver. La gravure, elle, n'apparaît pas à l'écran — elle est confirmée à la commande.",
          "Autant le savoir avant : la surprise porte sur le texte, pas sur l'objet. Les pièces sont conçues et fabriquées en France, de style japonais sans en revendiquer l'origine.",
        ],
      },
    ],
    productHeading: "Trois pièces à configurer pour la Saint-Valentin",
    faq: [
      {
        question: "Voit-on la gravure sur le modèle 3D avant de commander ?",
        answer:
          "Non. Le configurateur restitue la couleur, la teinte et les matières, mais pas le texte gravé : il est confirmé au moment de la commande.",
      },
      {
        question: "Peut-on commander deux pièces gravées différemment ?",
        answer:
          "Oui. Chaque configuration est enregistrée sur sa propre ligne de panier : deux paires de baguettes avec deux prénoms différents sont deux lignes.",
      },
      {
        question: "Est-ce un cadeau adapté à un début de relation ?",
        answer:
          "Un objet gravé à un prénom engage plus qu'un bouquet. À quelques semaines de relation, la version sans gravure — configurée mais neutre — est souvent plus juste.",
      },
    ],
  },

  {
    slug: "maman",
    seoTitle: "Cadeau personnalisé maman : à configurer et graver",
    seoDescription:
      "Éventail, ombrelle ou baguettes : vous choisissez la matière, la teinte et le motif, puis le texte gravé. Pièces fabriquées en France après commande.",
    targetKeyword: "cadeau personnalisé maman",
    secondaryKeywords: [],
    h1: "Offrir à sa mère autre chose qu'un objet de catalogue",
    breadcrumbLabel: "Pour maman",
    intro: [
      "Le cadeau pour une mère souffre d'un excès d'offre : bijoux, coffrets bien-être, encadrés à message. Tout y est joli et interchangeable. Un objet configuré prend le chemin inverse — il commence par une série de choix que personne d'autre ne fera dans le même ordre.",
      "Le mot « personnalisé » est trompeur dans ce rayon : il désigne le plus souvent une impression sur un article standard. Ici, la matière, la couleur et le motif se choisissent avant fabrication.",
    ],
    sections: [
      {
        heading: "L'éventail, quand le cadeau doit aussi se regarder",
        paragraphs: [
          "L'éventail pliant est le plus démonstratif des trois : quatre axes de personnalisation, dont un motif sur le papier et une finition de vis en or, argent, bronze ou noir. C'est un objet qui se pose autant qu'il s'utilise.",
          "L'ombrelle joue une autre partition, plus sobre : une couleur, une toile, et la gravure sur le manche. Les baguettes, elles, entrent dans un quotidien plutôt que dans une vitrine.",
        ],
      },
      {
        heading: "Fabriqué en France, de style japonais",
        paragraphs: [
          "Les formes sont japonaises, la fabrication ne l'est pas. Nous concevons et fabriquons en France, et nous ne revendiquons ni matière ni savoir-faire japonais — trop de boutiques entretiennent ce flou, il vaut mieux le dissiper.",
          "Chaque pièce est fabriquée après la commande, à partir de la configuration que vous avez validée à l'écran.",
        ],
      },
    ],
    productHeading: "Trois pièces à configurer pour elle",
    faq: [
      {
        question: "Peut-on choisir un motif en dehors du catalogue ?",
        answer:
          "Non. Le configurateur propose trois motifs et cinq couleurs de papier, et n'accepte pas d'image importée. C'est ce qui permet de garantir le rendu.",
      },
      {
        question: "Quelle pièce offrir si je ne connais pas ses goûts ?",
        answer:
          "L'ombrelle et l'éventail se choisissent surtout sur la couleur ; les baguettes supposent qu'elle s'en serve. En cas de doute, la teinte naturelle et une finition sobre passent partout.",
      },
      {
        question: "La gravure peut-elle porter un mot d'enfant ?",
        answer:
          "Oui, si tient sur une ligne courte. Un prénom, une date, quelques mots — pas une phrase entière.",
      },
    ],
  },

  {
    slug: "maitresse",
    seoTitle: "Cadeau personnalisé maîtresse : gravé à son nom",
    seoDescription:
      "Sortir du mug et de la bougie : une pièce configurée option par option et gravée à son nom, entre 25 et 45 €. Fabriquée en France après commande.",
    targetKeyword: "cadeau personnalisé maîtresse",
    secondaryKeywords: [],
    h1: "Remercier une maîtresse sans retomber sur le mug",
    breadcrumbLabel: "Pour la maîtresse",
    intro: [
      "En fin d'année scolaire, une enseignante reçoit la même chose plusieurs fois : des mugs, des bougies, des savons. Le problème n'est pas la qualité, c'est la répétition — et le fait que rien de tout cela ne rappelle une classe en particulier.",
      "Un objet gravé à son nom règle ce point. Il ne se confond avec aucun autre, et il n'a pas besoin d'être cher pour cela.",
    ],
    sections: [
      {
        heading: "Un budget qui tient dans une cagnotte de classe",
        paragraphs: [
          "Les trois pièces se situent entre 25 et 45 €, gravure en supplément. C'est l'ordre de grandeur d'une cagnotte partagée entre quelques familles, sans mettre personne mal à l'aise.",
          "Les baguettes sont le choix le plus simple à assumer collectivement : un objet utile, neutre, qui ne suppose rien de la vie privée de la personne.",
        ],
      },
      {
        heading: "Ce que la gravure permet — et ce qu'elle ne permet pas",
        paragraphs: [
          "Une ligne courte suffit pour un nom, une année scolaire, ou le nom de la classe. C'est ce format qui rend l'objet identifiable des années plus tard.",
          "Les pièces sont conçues et fabriquées en France, de style japonais. Chacune est fabriquée après la commande, à partir de la configuration validée à l'écran.",
        ],
      },
    ],
    productHeading: "Trois pièces à configurer pour la remercier",
    faq: [
      {
        question: "Peut-on faire graver un dessin d'enfant ?",
        answer:
          "Non. La gravure n'accepte que du texte. Un dessin, même simplifié, ne peut pas être reproduit par ce procédé.",
      },
      {
        question: "Peut-on graver le nom de la classe ?",
        answer:
          "Oui, si cela tient sur une ligne courte — « CM2 B, 2026 » par exemple. Une liste de prénoms, non.",
      },
      {
        question: "Est-ce approprié pour un cadeau collectif ?",
        answer:
          "Oui, et c'est même le cas de figure le plus simple : une seule pièce gravée d'un nom vaut mieux que trente objets identiques.",
      },
    ],
  },

  {
    slug: "meilleure-amie",
    seoTitle: "Cadeau personnalisé meilleure amie à configurer",
    seoDescription:
      "Choisissez la matière, la teinte et le motif, ajoutez son prénom gravé, voyez le rendu en 3D avant de commander. Pièces fabriquées en France.",
    targetKeyword: "cadeau personnalisé meilleure amie",
    secondaryKeywords: [],
    h1: "Un objet choisi pour elle, pas pour tout le monde",
    breadcrumbLabel: "Pour sa meilleure amie",
    intro: [
      "Offrir à sa meilleure amie a une difficulté particulière : vous la connaissez trop bien pour vous contenter d'un objet générique, et elle le verra tout de suite. Le cadeau doit porter une décision, pas un rayon.",
      "C'est ce que change un configurateur. Vous ne choisissez pas un article, vous choisissez une teinte, un motif, une finition — et un prénom gravé.",
    ],
    sections: [
      {
        heading: "Configurer, c'est déjà offrir quelque chose",
        paragraphs: [
          "Les cinq teintes de bois vont du naturel à l'ébène, les cinq couleurs du blanc nacré au vermillon. L'éventail ajoute un motif sur le papier et une finition de vis. Chaque combinaison produit un objet différent, visible en 3D avant validation.",
          "Le temps passé à configurer est le vrai contenu du cadeau : c'est ce qui distingue un objet choisi d'un objet acheté.",
        ],
      },
      {
        heading: "Fabriqué à la commande, en France",
        paragraphs: [
          "Rien n'est fabriqué à l'avance. La pièce part en production une fois votre configuration validée, dans nos ateliers en France. Les formes sont de style japonais ; l'origine ne l'est pas, et nous ne prétendons pas le contraire.",
          "Cela vaut d'être dit pour un cadeau d'amitié : si elle vous demande d'où vient l'objet, la réponse est nette. Beaucoup de boutiques laissent croire à une provenance japonaise que rien ne fonde — un flou qui finit toujours par se retourner contre le cadeau.",
        ],
      },
    ],
    productHeading: "Trois pièces à configurer pour elle",
    faq: [
      {
        question: "Peut-on offrir la configuration à faire soi-même ?",
        answer:
          "Non. Il n'existe pas de bon d'achat à configurer : la commande porte sur une pièce déjà configurée. C'est vous qui faites les choix.",
      },
      {
        question: "Que graver si je ne veux pas d'un prénom ?",
        answer:
          "Une date, une phrase courte, un surnom. La seule contrainte est la longueur : une ligne, pas davantage.",
      },
      {
        question: "Peut-on modifier la configuration après l'avoir mise au panier ?",
        answer:
          "Oui, tant que la commande n'est pas passée : rouvrez la fiche depuis le panier, la configuration est conservée et reste modifiable.",
      },
    ],
  },

  {
    slug: "couple",
    seoTitle: "Cadeau personnalisé pour couple, gravé et assorti",
    seoDescription:
      "Deux pièces configurées dans la même teinte, gravées chacune d'un prénom : mariage, pacs ou crémaillère. Fabriquées en France après commande.",
    targetKeyword: "cadeau personnalisé pour couple",
    secondaryKeywords: [],
    h1: "Deux pièces assorties, chacune gravée",
    breadcrumbLabel: "Pour un couple",
    intro: [
      "Offrir à deux personnes pose un problème que le cadeau individuel ignore : il faut que l'objet vaille pour les deux sans effacer ni l'un ni l'autre. Le coffret commun règle mal la question — il appartient au foyer, à personne en particulier.",
      "Deux pièces configurées dans la même teinte, gravées chacune d'un prénom, tiennent les deux bouts : l'ensemble se voit, la part de chacun aussi.",
    ],
    sections: [
      {
        heading: "Assortir sans dupliquer",
        paragraphs: [
          "La méthode la plus simple : deux paires de baguettes, même teinte de bois, deux prénoms différents. La cohérence vient de la matière, la distinction de la gravure.",
          "Variante moins attendue : deux teintes voisines de la même palette — miel et châtaigne, par exemple — qui se répondent sans être identiques.",
        ],
      },
      {
        heading: "Mariage, pacs, crémaillère",
        paragraphs: [
          "Ces trois occasions ont un point commun : le couple reçoit beaucoup d'objets pour la maison et très peu qui portent leurs deux noms. Un objet gravé au prénom échappe à la liste de mariage sans la contredire.",
          "Pour une crémaillère, les baguettes ont un avantage pratique : elles trouvent leur place dans n'importe quelle cuisine, ce qui n'est pas le cas d'un objet décoratif imposé à un intérieur qu'on ne connaît pas encore.",
          "Les pièces sont conçues et fabriquées en France, de style japonais. Chacune part en fabrication après la commande, à partir de la configuration validée à l'écran.",
        ],
      },
    ],
    productHeading: "Composer un ensemble à deux",
    faq: [
      {
        question: "Les deux pièces sont-elles vendues ensemble ?",
        answer:
          "Non. Il n'existe pas de lot : ce sont deux commandes de la même pièce, configurées séparément. C'est ce qui permet deux gravures différentes.",
      },
      {
        question: "Comment garantir que les deux teintes soient identiques ?",
        answer:
          "En sélectionnant la même teinte dans le configurateur pour les deux lignes. Le rendu 3D permet de comparer avant de valider.",
      },
      {
        question: "Peut-on graver les deux prénoms sur une seule pièce ?",
        answer:
          "Oui, si l'ensemble tient sur une ligne courte. « Léa & Sami » passe ; deux prénoms longs séparés d'une date, non.",
      },
    ],
  },
]

/** Landing par son slug, ou `null`. */
export function getOccasionLanding(
  slug: string | undefined
): OccasionLanding | null {
  if (!slug) return null
  return OCCASION_LANDINGS.find((o) => o.slug === slug) ?? null
}
