import type { ConfigurableHandle } from "@modules/configurator/config/configurableProducts"

/**
 * Contenu éditorial des fiches produit — source UNIQUE.
 *
 * Alimente à la fois le HTML rendu et le JSON-LD (`FAQPage`, `Product.material`,
 * `countryOfOrigin`) : les deux ne peuvent pas diverger, ce qui est la première
 * cause de données structurées invalidées par Google.
 *
 * ⚠️ RÈGLES D'ÉCRITURE — voir aussi l'en-tête de `lib/util/seo.ts`.
 *  1. Aucune allégation d'origine japonaise. « japonais » décrit le PRODUIT,
 *     jamais la fabrication ni la matière.
 *  2. « personnalisé » ne va jamais seul : toujours accompagné de « sur-mesure »
 *     ou « à configurer ». Jamais « créer de zéro » — le configurateur propose
 *     un choix dans un catalogue fermé, pas une création ex nihilo.
 *  3. La gravure est UNE option parmi trois à cinq, facturée en supplément :
 *     jamais en tête d'un titre ni d'un H1.
 *
 * ⚠️ NE RIEN INVENTER. `material` vaut `null` tant que l'essence réelle n'a pas
 * été fournie, et les sections correspondantes ne sont pas écrites. Un JSON-LD
 * qui affirme une matière fausse est pire que l'absence de JSON-LD : Google
 * sanctionne l'écart entre la donnée structurée et le contenu de la page.
 */

export type ProductFaqItem = {
  question: string
  answer: string
}

export type ProductSection = {
  /** Rendu en <h2>. */
  heading: string
  paragraphs: string[]
}

export type ProductEditorial = {
  /**
   * Titre SEO. 46–51 caractères : le gabarit `%s | Hinaso` en ajoute 9, pour un
   * total de 55–60. Le mot-clé cible tient dans les 40 premiers caractères,
   * seule portion affichée sur mobile.
   */
  seoTitle: string
  /** 140–155 caractères. Donne une RAISON DE CLIQUER, pas un résumé de la page. */
  seoDescription: string
  /**
   * Mot-clé cible UNIQUE (corpus validé) — un seul par page.
   *
   * `null` quand le corpus n'assigne aucun mot-clé à cette page : c'est le cas
   * de la fiche éventail, « éventail japonais » (185) étant porté par la
   * catégorie. Mieux vaut l'assumer que d'inventer une cible hors corpus.
   */
  targetKeyword: string | null
  /** Ouverture : lève l'ambiguïté par le contraste (ce que ce n'est pas, puis ce que c'est). */
  intro: string[]
  sections: ProductSection[]
  faq: ProductFaqItem[]

  /* ── Données factuelles reprises dans le JSON-LD ───────────────────── */
  /** Ex. « Hêtre massif ». `null` tant que l'essence réelle est inconnue. */
  material: string | null
  /** Pays de fabrication — le seul fait d'origine établi à ce jour. */
  countryOfOrigin: string
}

/**
 * TODO — données produit manquantes, bloquantes pour terminer les fiches :
 *   · essence(s) de bois des baguettes et de la monture d'éventail
 *   · matière et grammage du papier de l'éventail
 *   · matière de la toile de l'ombrelle
 *   · dimensions et poids des trois produits
 *   · délai de fabrication, délai d'expédition, transporteur
 *   · durée de rétractation appliquée aux pièces configurées
 *
 * Tant qu'elles manquent, les sections « Matières » et « Fabrication et
 * expédition » ne sont pas rédigées et les fiches plafonnent autour de 380 mots
 * au lieu des 450–500 visés. Elles s'ajoutent ici, sans toucher au composant de
 * rendu ni au JSON-LD.
 */

export const PRODUCT_EDITORIAL: Record<ConfigurableHandle, ProductEditorial> = {
  baguettes: {
    seoTitle: "Baguettes japonaises personnalisées à configurer",
    seoDescription:
      "Choisissez la couleur, la teinte du bois et le texte gravé, puis voyez vos baguettes tourner en 3D avant de commander. Conçues et fabriquées en France.",
    targetKeyword: "baguettes japonaises personnalisées",
    intro: [
      "Ce ne sont pas des baguettes à motif imprimé, vendues dans une finition unique décidée à l'avance. Ce sont des baguettes que vous configurez : vous choisissez la couleur, la teinte du bois et, si vous le souhaitez, le texte gravé — et vous voyez le résultat tourner en 3D avant de valider.",
      "Rien n'est décidé pour vous, et rien n'est fabriqué avant votre commande.",
    ],
    sections: [
      {
        heading: "Ce que vous choisissez",
        paragraphs: [
          "Le configurateur propose deux axes indépendants. La couleur d'abord : blanc nacré, noir laqué, vermillon, or ou bleu indigo. La teinte du bois ensuite, du naturel à l'ébène en passant par le miel, la châtaigne et le noyer — cinq paliers qui creusent la profondeur du bois sans masquer son veinage.",
          "La gravure vient en dernier, en option et en supplément. Elle accepte un prénom, une date ou une phrase courte, et n'est facturée que si vous saisissez un texte.",
          "Ces choix ont une limite assumée : c'est une sélection dans un catalogue fermé, pas une création sans contrainte. En échange, le rendu 3D montre exactement la pièce qui sera fabriquée.",
        ],
      },
      {
        heading: "Comment se passe la configuration",
        paragraphs: [
          "Tout se joue dans le panneau latéral. Chaque option ouvre sa liste de choix, et le modèle se recadre pour rendre le changement lisible. Vous pouvez le faire tourner et zoomer librement pour vérifier un détail avant de trancher.",
          "Les suppléments s'ajoutent au fil des choix : le prix affiché suit votre configuration en direct, sans surprise au moment de valider.",
          "Une fois la pièce ajoutée au panier, sa configuration y est enregistrée. Rouvrez la fiche depuis le panier et vous reprenez exactement là où vous vous étiez arrêté.",
        ],
      },
      {
        heading: "Conception et fabrication",
        paragraphs: [
          "Ces baguettes sont de style japonais : c'est leur forme et leur usage qui le sont. Elles sont conçues et fabriquées en France. Ni le bois ni le façonnage ne viennent du Japon, et nous préférons l'écrire noir sur blanc plutôt que d'entretenir le flou.",
        ],
      },
    ],
    faq: [
      {
        question: "Ces baguettes viennent-elles du Japon ?",
        answer:
          "Non. Elles sont de style japonais, mais conçues et fabriquées en France. Aucune matière ni aucune étape de fabrication n'est japonaise.",
      },
      {
        question: "Puis-je faire graver le texte de mon choix ?",
        answer:
          "Oui, dans la limite d'une ligne courte : un prénom, une date ou quelques mots. La gravure est une option facturée en supplément, ajoutée seulement si vous saisissez un texte.",
      },
      {
        question: "Le rendu 3D correspond-il au produit livré ?",
        answer:
          "Oui pour la couleur, la teinte et le placement de la gravure. La restitution exacte d'une teinte dépend toutefois du réglage de votre écran.",
      },
      {
        question: "Puis-je les passer au lave-vaisselle ?",
        answer:
          "Un lavage à la main, à l'eau tiède, suivi d'un séchage immédiat, préserve la finition. Les passages répétés au lave-vaisselle l'abîment.",
      },
    ],
    material: null,
    countryOfOrigin: "FR",
  },

  eventail: {
    // « éventail japonais » (185) est porté par la CATÉGORIE, page large et
    // comparative. Cette fiche est transactionnelle : elle joue « sensu » et le
    // configurateur. Les deux titres ne se disputent donc pas la même requête.
    seoTitle: "Éventail sensu sur-mesure : configurez-le en 3D",
    seoDescription:
      "Monture, couleur du papier, motif, finition des vis : configurez votre éventail et voyez-le en 3D avant de commander. Conçu et fabriqué en France.",
    targetKeyword: null,
    intro: [
      "Un éventail japonais pliant, ou sensu, se vend le plus souvent avec un motif imprimé qu'on prend tel quel. Celui-ci fonctionne autrement : vous assemblez la monture, la couleur du papier, le motif et la finition des vis, et le modèle 3D se met à jour à chaque choix.",
      "Quatre axes de personnalisation, et une seule pièce à l'arrivée — la vôtre.",
    ],
    sections: [
      {
        heading: "Ce que vous choisissez",
        paragraphs: [
          "La monture se décline en cinq teintes de bois, du naturel à l'ébène. Le papier reçoit l'une des cinq couleurs de la palette, puis un motif parmi les trois proposés — ou aucun, si vous préférez un aplat uni.",
          "Les vis d'assemblage, qu'on regarde rarement, se choisissent en or, argent, bronze ou noir. C'est le détail qui fait basculer l'objet du discret au démonstratif.",
          "La gravure ferme la liste : optionnelle, facturée en supplément, appliquée uniquement si vous saisissez un texte.",
        ],
      },
      {
        heading: "Comment se passe la configuration",
        paragraphs: [
          "Ouvrir une option recadre la caméra sur la pièce concernée — la monture, le papier ou les vis — puis la vue revient d'elle-même quand vous refermez le menu. C'est ce qui permet de juger une finition de vis sans la chercher sur un modèle vu de loin.",
          "Le prix affiché suit votre configuration en direct : chaque supplément s'ajoute au moment où vous le choisissez, pas au moment de payer.",
          "Après ajout au panier, la configuration y reste attachée. Vous pouvez rouvrir la fiche depuis le panier et modifier n'importe lequel des quatre axes sans tout reprendre.",
        ],
      },
      {
        heading: "Conception et fabrication",
        paragraphs: [
          "L'éventail est de style japonais par sa forme et son mécanisme. Il est conçu et fabriqué en France : ni la monture, ni le papier, ni l'assemblage ne viennent du Japon.",
        ],
      },
    ],
    faq: [
      {
        question: "Puis-je faire imprimer ma propre image sur le papier ?",
        answer:
          "Non. Le configurateur propose trois motifs et cinq couleurs de papier, et n'accepte pas d'image importée. Le sur-mesure porte sur la combinaison, pas sur le visuel.",
      },
      {
        question: "Cet éventail est-il fabriqué au Japon ?",
        answer:
          "Non. Il est de style japonais, mais conçu et fabriqué en France. Nous ne revendiquons ni origine ni savoir-faire japonais.",
      },
      {
        question: "Quelle différence avec un éventail uchiwa ?",
        answer:
          "L'uchiwa est un éventail rigide d'une seule pièce, qui ne se plie pas. Celui-ci est un sensu : il se plie, se transporte et se range.",
      },
      {
        question: "Puis-je modifier ma configuration après coup ?",
        answer:
          "Oui, tant que la commande n'est pas passée : rouvrez la fiche depuis votre panier, la configuration est conservée et reste modifiable.",
      },
    ],
    material: null,
    countryOfOrigin: "FR",
  },

  ombrelle: {
    seoTitle: "Ombrelle japonaise sur-mesure à configurer en 3D",
    seoDescription:
      "Couleur, toile et gravure du manche au choix : configurez votre ombrelle japonaise et voyez-la en 3D avant de commander. Conçue et fabriquée en France.",
    targetKeyword: "ombrelle japonaise",
    intro: [
      "Une ombrelle japonaise s'achète d'ordinaire dans un coloris figé, motif compris. Celle-ci se configure : vous fixez la couleur, vous choisissez la toile, vous ajoutez au besoin une gravure sur le manche, et le modèle 3D suit chaque décision.",
      "Vous ne commandez pas un article de catalogue, mais la combinaison que vous venez de voir à l'écran.",
    ],
    sections: [
      {
        heading: "Ce que vous choisissez",
        paragraphs: [
          "La couleur se prend dans la palette maison : blanc nacré, noir laqué, vermillon, or ou bleu indigo. La toile se décline ensuite en trois finitions — indigo, kraft ou noir — qui changent autant la matité que la teinte.",
          "La gravure du manche vient en dernier. Optionnelle et facturée en supplément, elle n'est appliquée que si vous saisissez un texte.",
          "Trois axes, un catalogue fermé : le configurateur ne promet pas l'infini, il promet que ce que vous voyez est ce que vous recevrez.",
        ],
      },
      {
        heading: "Comment se passe la configuration",
        paragraphs: [
          "Chaque option ouvre sa liste dans le panneau latéral et le modèle se recadre pour rendre le changement lisible. Faites-le tourner, zoomez : c'est la même pièce que celle qui sera fabriquée, vue sous tous les angles.",
          "Le prix suit vos choix en direct. Les suppléments s'ajoutent quand vous les sélectionnez, jamais après.",
          "La configuration est enregistrée avec la ligne de panier. Rouvrez la fiche depuis le panier pour reprendre votre ombrelle telle que vous l'aviez laissée.",
        ],
      },
      {
        heading: "Conception et fabrication",
        paragraphs: [
          "L'ombrelle est de style japonais. Elle est conçue et fabriquée en France : ni la toile, ni la monture, ni le montage ne sont japonais, et nous ne prétendons pas le contraire.",
        ],
      },
    ],
    faq: [
      {
        question: "Puis-je choisir une toile en dehors des trois proposées ?",
        answer:
          "Non. Le configurateur propose trois toiles — indigo, kraft et noir — et cette liste est fermée. C'est le prix d'un rendu 3D fidèle à la pièce réellement fabriquée.",
      },
      {
        question: "Cette ombrelle vient-elle du Japon ?",
        answer:
          "Non. Elle est de style japonais, mais conçue et fabriquée en France. Aucune matière ni étape de fabrication n'est japonaise.",
      },
      {
        question: "La gravure du manche est-elle comprise dans le prix ?",
        answer:
          "Non, c'est une option facturée en supplément. Elle n'est ajoutée à la commande que si vous saisissez un texte dans le configurateur.",
      },
      {
        question: "Le rendu 3D correspond-il au produit livré ?",
        answer:
          "Oui pour la couleur, la toile et le placement de la gravure. La restitution exacte d'une teinte dépend toutefois du réglage de votre écran.",
      },
    ],
    material: null,
    countryOfOrigin: "FR",
  },
}

/** Contenu éditorial d'un produit, ou `null` si la fiche n'en a pas encore. */
export function getProductEditorial(
  handle: string | undefined
): ProductEditorial | null {
  if (!handle) return null
  return PRODUCT_EDITORIAL[handle as ConfigurableHandle] ?? null
}
