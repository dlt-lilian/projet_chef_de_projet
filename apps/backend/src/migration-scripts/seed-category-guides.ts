import { MedusaContainer } from "@medusajs/framework";
import { ContainerRegistrationKeys } from "@medusajs/framework/utils";
import { BLOG_MODULE } from "../modules/blog";
import type BlogModuleService from "../modules/blog/service";

// ──────────────────────────────────────────────────────────────────────
// Reprise au blog du contenu éditorial des pages de CATÉGORIE.
//
// CE QUE FAIT CE SCRIPT, EN DEUX TEMPS.
//
// 1. Il crée deux guides d'achat à partir du texte qui vivait dans
//    `apps/storefront/src/lib/content/categories.ts` — sections et FAQ des
//    familles « baguettes » et « éventail ».
// 2. Il repointe les liens internes des contenus DÉJÀ publiés : les
//    `/fr/categories/{handle}` deviennent des `/fr/products/{handle}`.
//
// POURQUOI DÉPLACER. Ces pages étaient atteintes par le seul pied de page (la
// navbar pointe sur les fiches depuis le 2026-08-23). Ce maillage a été retiré :
// trois ancres quasi exactes répétées sur chaque page du site sont le signal de
// sur-optimisation le plus facile à détecter, et elles envoyaient le jus vers
// des listings d'UNE référence. Les catégories passent en `noindex, follow`.
//
// Le texte, lui, n'avait rien d'un listing : il expliquait, comparait,
// répondait. C'est un article. Au blog il se maille avec l'existant et reste
// modifiable en backoffice, ce que ne permettait pas un fichier TypeScript.
//
// PAS DE TROISIÈME ARTICLE POUR L'OMBRELLE. Ses deux paragraphes disaient, en
// plus court, ce que dit déjà la section finale de « Wagasa : l'ombrelle
// japonaise » (« Ce que nous fabriquons — et ce que non ») : même configurateur,
// même mise au point sur l'origine française. Les recopier aurait produit un
// doublon interne, exactement ce que ce chantier corrige.
//
// LE GUIDE ÉVENTAIL NE REFAIT PAS L'ARTICLE UCHIWA/SENSU. Sa première section
// pose la distinction en deux paragraphes puis renvoie vers l'article qui la
// traite. Deux pages qui expliquent la même chose se concurrencent ; une page
// qui renvoie vers l'autre les renforce toutes les deux.
//
// PAS D'IMAGES, comme pour `seed-editorial-articles.ts` : `cover` reste vide et
// aucun bloc bannière n'est posé faute de visuel réel. Le H1 est alors rendu
// par ArticleTemplate.
//
// Idempotent : un slug déjà présent est ignoré, jamais écrasé — l'article
// pourrait avoir été retravaillé en backoffice depuis. La réécriture de liens
// (temps 2) est idempotente par nature : elle ne trouve plus rien à remplacer
// au second passage.
//
// Usage depuis la racine du backend :
//   npx medusa exec ./src/migration-scripts/seed-category-guides.ts
// ──────────────────────────────────────────────────────────────────────

type Block =
  | { type: "titre"; level: 2 | 3; text: string }
  | { type: "texte"; content: string; dropcap?: boolean };

type Article = {
  slug: string;
  /** Sert de <title> (avec « | Hinaso ») ET de H1 : ≤ 51 caractères. */
  title: string;
  /** Sert de meta description ET de chapô sur la liste : 140–155 caractères. */
  excerpt: string;
  category: string;
  read_time: string;
  date: string;
  date_iso: string;
  blocks: Block[];
};

// Les liens internes portent le préfixe /fr : le contenu est rédigé en
// français et la France est le marché prioritaire. Un chemin sans pays
// passerait par une redirection 308 du middleware à chaque clic.
//
// LA SECTION FAQ SUIT UNE CONVENTION LUE PAR LE STOREFRONT : un H2
// « Questions fréquentes », puis un H3 par question suivi de sa réponse.
// `apps/storefront/src/lib/blog/faq.ts` s'en sert pour émettre le FAQPage que
// les pages de catégorie émettaient auparavant. Renommer ce H2 ou changer le
// niveau des questions retire le balisage sans casser l'affichage.
const ARTICLES: Article[] = [
  {
    slug: "choisir-ses-baguettes-japonaises",
    title: "Baguettes japonaises : comment choisir les vôtres",
    excerpt:
      "Longueur, matière, finition : ce qui distingue vraiment une paire de baguettes japonaises, et comment configurer les vôtres avant de commander.",
    category: "Guide",
    read_time: "4 min",
    date: "8 septembre 2026",
    date_iso: "2026-09-08",
    blocks: [
      {
        type: "texte",
        content:
          "Une paire de baguettes se choisit en trente secondes en magasin, et s'utilise pendant des années. Trois critères suffisent à faire la différence entre les deux — et aucun n'est le motif imprimé dessus.",
        dropcap: true,
      },
      {
        type: "titre",
        level: 2,
        text: "Ce qui distingue une paire de baguettes japonaises",
      },
      {
        type: "texte",
        content:
          "<p>Les baguettes japonaises se reconnaissent à leur pointe : plus fine et plus effilée que celle des baguettes chinoises, souvent plus courtes aussi. Ce détail n'est pas décoratif — il change la prise, et donc ce qu'on peut attraper avec.</p><p>Le reste tient à la finition. Un bois brut accroche, un bois laqué glisse ; une teinte sombre marque moins les traces d'usage qu'un bois clair. Ce sont ces arbitrages, plus que la forme, qui font qu'une paire se garde ou finit au fond d'un tiroir.</p>",
      },
      {
        type: "titre",
        level: 2,
        text: "Choisies dans un catalogue, pas subies",
      },
      {
        type: "texte",
        content:
          "<p>La plupart des baguettes se vendent dans une finition unique, décidée avant vous. Notre parti pris est l'inverse : la couleur et la teinte du bois se choisissent au moment de la commande, et le rendu 3D montre la paire avant qu'elle ne soit fabriquée.</p><p>Cinq couleurs, cinq teintes de bois, et la gravure en option pour un prénom ou une date. Le catalogue est fermé — c'est ce qui permet de garantir que la pièce livrée ressemble à l'aperçu.</p><p>Sur une table dressée à la japonaise, les baguettes sont l'élément qu'on manipule le plus longtemps. C'est aussi le seul qui porte une marque personnelle sans dénaturer l'ensemble.</p>",
      },
      {
        type: "titre",
        level: 2,
        text: "Une paire bien choisie ne dispense pas du geste",
      },
      {
        type: "texte",
        content:
          "<p>Une paire trop lisse glisse, une paire trop lourde fatigue : le matériel compte, et c'est la moitié du sujet. L'autre moitié est la prise, où presque toutes les difficultés viennent d'une seule erreur — vouloir faire bouger les deux baguettes alors qu'une seule se déplace.</p><p>Si c'est le geste qui vous arrête plutôt que le choix, notre <a href=\"/fr/blog/comment-tenir-des-baguettes-japonaises\">guide pour tenir des baguettes sans forcer</a> détaille la prise et les trois séances qui suffisent à l'installer.</p>",
      },
      { type: "titre", level: 2, text: "Conception et fabrication" },
      {
        type: "texte",
        content:
          "<p>Ces baguettes sont de style japonais par la forme et l'usage. Elles sont conçues et fabriquées en France : ni le bois ni le façonnage ne viennent du Japon. Nous l'écrivons plutôt que de laisser planer un doute que d'autres entretiennent.</p><p>Pour choisir la couleur, la teinte du bois et l'éventuelle gravure avant fabrication, tout se passe sur la fiche des <a href=\"/fr/products/baguettes\">baguettes japonaises à configurer</a>.</p>",
      },
      { type: "titre", level: 2, text: "Questions fréquentes" },
      {
        type: "titre",
        level: 3,
        text: "Où acheter des baguettes japonaises ?",
      },
      {
        type: "texte",
        content:
          "<p>En épicerie asiatique et en grande surface pour les modèles d'entrée de gamme, en boutique d'arts de la table pour les paires travaillées, et en ligne pour tout ce qui se configure. Ici, vous choisissez la couleur, la teinte et la gravure avant fabrication.</p>",
      },
      { type: "titre", level: 3, text: "Quelle longueur choisir ?" },
      {
        type: "texte",
        content:
          "<p>Les baguettes japonaises sont traditionnellement plus courtes que les chinoises, et se déclinent par taille de main. Nous ne proposons qu'une longueur, pensée pour un usage adulte courant.</p>",
      },
      { type: "titre", level: 3, text: "Faut-il un repose-baguettes ?" },
      {
        type: "texte",
        content:
          "<p>Non, ce n'est pas obligatoire — mais poser les baguettes en travers du bol est mal vu à table. Un repose-baguettes, ou le bord d'une assiette, suffit.</p>",
      },
      {
        type: "titre",
        level: 3,
        text: "Ces baguettes sont-elles importées du Japon ?",
      },
      {
        type: "texte",
        content:
          "<p>Non. Elles sont de style japonais, conçues et fabriquées en France. Aucune matière ni aucune étape de fabrication n'est japonaise.</p>",
      },
    ],
  },

  {
    slug: "choisir-son-eventail-japonais",
    title: "Éventail japonais : comment choisir le vôtre",
    excerpt:
      "Pliant ou rigide, papier ou tissu, monture claire ou sombre : ce qui différencie vraiment les éventails japonais, et comment composer le vôtre en 3D.",
    category: "Guide",
    read_time: "4 min",
    date: "8 septembre 2026",
    date_iso: "2026-09-08",
    blocks: [
      {
        type: "texte",
        content:
          "Un éventail se juge à quatre détails, et le motif n'arrive qu'en troisième position. Voici l'ordre dans lequel les regarder, et ce que chacun change une fois l'objet en main.",
        dropcap: true,
      },
      {
        type: "titre",
        level: 2,
        text: "Pliant ou rigide : deux objets différents",
      },
      {
        type: "texte",
        content:
          "<p>Un éventail japonais pliant se replie sur sa monture et tient dans une poche : c'est celui qu'on emporte. Le modèle rigide, d'une seule pièce, ne se plie pas — il brasse plus d'air mais s'encombre.</p><p>Le choix se fait donc moins sur l'esthétique que sur l'usage : transporter, ou ventiler. Nous ne proposons que le pliant.</p><p>Les deux objets portent chacun leur nom et leur histoire : c'est le sujet de notre article sur les <a href=\"/fr/blog/eventail-japonais-uchiwa-ou-sensu\">différences entre uchiwa et sensu</a>, motifs et significations compris.</p>",
      },
      {
        type: "titre",
        level: 2,
        text: "Ce qui change vraiment d'un modèle à l'autre",
      },
      {
        type: "texte",
        content:
          "<p>La monture d'abord : une teinte claire allège l'objet, une teinte sombre le densifie. Le papier ensuite, dont la couleur porte l'essentiel de l'effet. Le motif enfin, qui peut tout changer — ou être absent, si l'on préfère un aplat uni.</p><p>Reste un détail qu'on regarde rarement en boutique et qui saute aux yeux une fois l'objet en main : la finition des vis d'assemblage. Or, argent, bronze ou noir, c'est ce qui fait basculer un éventail du discret au démonstratif.</p><p>Ces quatre axes se combinent dans le configurateur, et le modèle 3D se met à jour à chaque choix. Le catalogue est volontairement fermé : c'est la condition pour que l'aperçu corresponde à la pièce livrée.</p>",
      },
      { type: "titre", level: 2, text: "Conception et fabrication" },
      {
        type: "texte",
        content:
          "<p>Nos éventails sont de style japonais par la forme et le mécanisme. Ils sont conçus et fabriqués en France : ni la monture, ni le papier, ni l'assemblage ne viennent du Japon.</p><p>Pour composer la monture, la couleur du papier, le motif et la finition des vis avant fabrication, tout se passe sur la fiche de l'<a href=\"/fr/products/eventail\">éventail japonais à configurer</a>.</p>",
      },
      { type: "titre", level: 2, text: "Questions fréquentes" },
      {
        type: "titre",
        level: 3,
        text: "Un éventail japonais se répare-t-il ?",
      },
      {
        type: "texte",
        content:
          "<p>Une lame de monture cassée se remplace difficilement sans démonter l'ensemble. Le papier déchiré, lui, condamne en général l'objet — d'où l'intérêt d'une monture solide dès le départ.</p>",
      },
      { type: "titre", level: 3, text: "Comment le ranger sans l'abîmer ?" },
      {
        type: "texte",
        content:
          "<p>Replié, à plat, à l'abri de l'humidité. Le laisser ouvert en permanence fatigue le pli du papier et finit par le marquer.</p>",
      },
      {
        type: "titre",
        level: 3,
        text: "Peut-on offrir un éventail japonais ?",
      },
      {
        type: "texte",
        content:
          "<p>Oui, et la gravure en option permet d'y porter un prénom ou une date. C'est un objet plat et léger, facile à expédier ou à glisser dans un paquet.</p>",
      },
      {
        type: "titre",
        level: 3,
        text: "Vos éventails viennent-ils du Japon ?",
      },
      {
        type: "texte",
        content:
          "<p>Non. Ils sont de style japonais, mais conçus et fabriqués en France. Nous ne revendiquons ni origine ni savoir-faire japonais.</p>",
      },
    ],
  },
];

/**
 * Réécriture des liens internes déjà publiés.
 *
 * Les catégories restent servies (fil d'Ariane des fiches), mais en
 * `noindex, follow` : continuer d'y envoyer les liens éditoriaux ferait
 * traverser au lecteur un listing d'une seule référence avant d'atteindre la
 * fiche, et diluerait le maillage sur une page hors index.
 */
const LINK_REWRITES: { from: string; to: string }[] = [
  { from: "/fr/categories/baguettes-japonaises", to: "/fr/products/baguettes" },
  { from: "/fr/categories/eventail-japonais", to: "/fr/products/eventail" },
  { from: "/fr/categories/ombrelle-japonaise", to: "/fr/products/ombrelle" },
];

/**
 * Applique les réécritures à une valeur JSON quelconque.
 *
 * On descend dans les blocs plutôt que de sérialiser/désérialiser l'ensemble :
 * seules les CHAÎNES sont touchées, et rien d'autre de la structure n'est
 * reconstruit. Un article retravaillé en backoffice garde donc exactement sa
 * forme, aux href près.
 */
function rewriteLinks(value: unknown): { value: unknown; changed: boolean } {
  if (typeof value === "string") {
    let next = value;
    for (const { from, to } of LINK_REWRITES) {
      next = next.split(from).join(to);
    }
    return { value: next, changed: next !== value };
  }

  if (Array.isArray(value)) {
    let changed = false;
    const next = value.map((item) => {
      const result = rewriteLinks(item);
      if (result.changed) changed = true;
      return result.value;
    });
    return { value: changed ? next : value, changed };
  }

  if (value && typeof value === "object") {
    let changed = false;
    const next: Record<string, unknown> = {};
    for (const [key, item] of Object.entries(value)) {
      const result = rewriteLinks(item);
      if (result.changed) changed = true;
      next[key] = result.value;
    }
    return { value: changed ? next : value, changed };
  }

  return { value, changed: false };
}

export default async function seed_category_guides({
  container,
}: {
  container: MedusaContainer;
}) {
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER);
  const blogService: BlogModuleService = container.resolve(BLOG_MODULE);

  // ── 1. Création des guides ──────────────────────────────────────────
  let created = 0;
  let skipped = 0;

  for (const article of ARTICLES) {
    const existing = await blogService.getBlogPostBySlug(article.slug);
    if (existing) {
      skipped++;
      continue;
    }

    await blogService.createBlogPosts({
      slug: article.slug,
      title: article.title,
      excerpt: article.excerpt,
      cover: "",
      category: article.category,
      author: "Hinaso",
      date: article.date,
      date_iso: article.date_iso,
      read_time: article.read_time,
      featured: false,
      published: true,
      path: null,
      hide_breadcrumb: false,
      hide_meta: false,
      hide_footer: false,
      // `model.json()` se type en `Record<string, unknown>`, trop étroit : la
      // colonne JSONB stocke un TABLEAU de blocs, et c'est bien un tableau que
      // lit le storefront (`BlockRenderer` itère dessus). Le double cast dit
      // explicitement que le type déclaré est en retard sur la donnée réelle —
      // plutôt qu'un `any` qui masquerait aussi les erreurs de forme des blocs.
      blocks: article.blocks as unknown as Record<string, unknown>,
    });
    created++;
  }

  logger.info(
    `Guides catégorie : ${created} article(s) créé(s), ${skipped} déjà présent(s).`
  );

  // ── 2. Réécriture des liens des contenus existants ──────────────────
  // Brouillons et pages autonomes inclus : un lien vers une catégorie en
  // noindex est tout aussi indésirable dans un article non encore publié.
  const posts = await blogService.listBlogPosts({}, { take: 1000 });
  let rewritten = 0;

  for (const post of posts) {
    const { value, changed } = rewriteLinks(post.blocks);
    if (!changed) continue;

    await blogService.updateBlogPosts({
      id: post.id,
      blocks: value as Record<string, unknown>,
    });
    logger.info(`  ↳ liens catégorie repointés dans « ${post.slug} »`);
    rewritten++;
  }

  logger.info(
    `Liens internes : ${rewritten} contenu(s) mis à jour sur ${posts.length} examiné(s).`
  );
}
