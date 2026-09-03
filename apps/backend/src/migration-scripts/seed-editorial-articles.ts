import { MedusaContainer } from "@medusajs/framework";
import { ContainerRegistrationKeys } from "@medusajs/framework/utils";
import { BLOG_MODULE } from "../modules/blog";
import type BlogModuleService from "../modules/blog/service";

// ──────────────────────────────────────────────────────────────────────
// Articles éditoriaux issus du corpus de mots-clés.
//
// CINQ ARTICLES POUR HUIT MOTS-CLÉS. Trois requêtes sur l'éventail (uchiwa 110,
// traditionnel 90, signification 20) posent la même question — « qu'est-ce
// qu'un éventail japonais » — et sont réunies. Idem pour « wagasa » (110) et
// « ombrelle japonaise ancienne » (90), qui désignent le même objet. Trois
// articles minces se seraient concurrencés entre eux et avec la catégorie.
//
// « GRAVURE SUR BOIS » (2 571) EST ÉCARTÉ. Le corpus le donnait « à confirmer
// par SERP avant investissement » : vérification faite, la page de résultats
// est partagée entre l'histoire de l'art (xylogravure, estampe) et le B2B
// (machines laser, plaques et enseignes). L'expression désigne un PROCÉDÉ
// D'IMPRESSION EN RELIEF, pas le marquage d'un prénom sur un objet. Même piège
// que « parapluie japonais » : gros volume, mauvaise intention.
//
// Volume réellement adressé : 840 recherches mensuelles.
//
// PAS D'IMAGES. `cover` reste vide et aucun bloc bannière n'est posé : aucun
// visuel réel n'est disponible, et remettre des placeholders reproduirait le
// problème que le reste du chantier corrige. Les cartes du blog gèrent
// l'absence de couverture. Le H1 est alors rendu par ArticleTemplate.
//
// Idempotent : un slug déjà présent est ignoré, jamais écrasé — l'article
// pourrait avoir été retravaillé en backoffice depuis.
// ──────────────────────────────────────────────────────────────────────

type Block =
  | { type: "titre"; level: 2 | 3; text: string }
  | { type: "texte"; content: string; dropcap?: boolean }

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
const ARTICLES: Article[] = [
  {
    slug: "eventail-japonais-uchiwa-ou-sensu",
    title: "Éventail japonais uchiwa ou sensu : les différences",
    excerpt:
      "L'un se plie, l'autre non. Ce que distinguent vraiment le sensu et l'uchiwa, à quoi sert chacun, et ce que racontent les motifs qu'on y trouve.",
    category: "Culture",
    read_time: "5 min",
    date: "2 septembre 2026",
    date_iso: "2026-09-02",
    blocks: [
      {
        type: "texte",
        content:
          "Sous le mot « éventail japonais » se cachent deux objets qui n'ont ni la même forme, ni le même usage, ni la même histoire. Les confondre mène à acheter le mauvais — celui qui ne rentre pas dans un sac, ou celui qui ne brasse rien.",
        dropcap: true,
      },
      { type: "titre", level: 2, text: "Le sensu : celui qui se plie" },
      {
        type: "texte",
        content:
          "<p>Le sensu (扇子) est l'éventail pliant. Une monture de fines lames articulées autour d'une vis, un papier plissé collé dessus, et l'objet passe de vingt centimètres déployés à quatre repliés. C'est celui qu'on glisse dans une poche ou dans un sac.</p><p>Cette compacité a un prix : la surface est réduite et le pli fatigue avec le temps. Un sensu laissé ouvert en permanence marque son papier là où il aurait dû se replier.</p>",
      },
      { type: "titre", level: 2, text: "L'uchiwa : celui qui ne se plie pas" },
      {
        type: "texte",
        content:
          "<p>L'uchiwa (団扇) est rigide, d'une seule pièce : une surface tendue sur un cadre, prolongée par un manche. Il brasse beaucoup plus d'air qu'un sensu, ce qui en fait l'objet des festivals d'été et des soirées chaudes.</p><p>En contrepartie il ne se range pas. On le pose, on l'accroche, on le tient — on ne le transporte pas discrètement.</p><p>Le partage est simple : l'uchiwa ventile, le sensu accompagne.</p>",
      },
      {
        type: "titre",
        level: 2,
        text: "Ce que signifient les motifs",
      },
      {
        type: "texte",
        content:
          "<p>Les motifs traditionnels ne sont pas décoratifs par hasard. La vague renvoie à la persévérance — elle revient toujours. Le pin évoque la longévité, la grue le bonheur durable, la fleur de cerisier la beauté brève, précisément parce qu'elle tombe vite.</p><p>La forme même du sensu porte un sens : elle s'élargit vers l'extérieur, ce qui en a fait un objet associé à la prospérité qui s'étend. C'est l'une des raisons pour lesquelles on l'offre encore lors de cérémonies.</p><p>Rien n'oblige à choisir un motif pour sa signification. Mais savoir ce qu'il raconte évite d'offrir une fleur de cerisier — la beauté qui passe — à quelqu'un qui célèbre un engagement durable.</p>",
      },
      { type: "titre", level: 2, text: "Ce qui abîme un éventail pliant" },
      {
        type: "texte",
        content:
          "<p>Trois gestes suffisent à ruiner un sensu. Le premier : l'ouvrir d'un coup sec, comme au cinéma. Le papier travaille alors sur toute sa longueur d'un seul mouvement et le pli se fend, généralement près de la monture. Un sensu s'ouvre en accompagnant les lames avec le pouce.</p><p>Le deuxième : le laisser ouvert. Le papier plissé garde sa forme par mémoire du pli ; maintenu déployé plusieurs jours, il perd cette mémoire et ne se referme plus proprement.</p><p>Le troisième : l'humidité. Un papier collé sur bois se décolle. Un éventail rangé dans une salle de bain ou au fond d'un sac de plage dure une saison, pas dix ans.</p><p>Rangé replié, à plat, au sec, un éventail traverse facilement une décennie — c'est d'ailleurs pourquoi il se transmet.</p>",
      },
      { type: "titre", level: 2, text: "« Traditionnel » ne veut pas dire japonais" },
      {
        type: "texte",
        content:
          "<p>Un éventail de forme traditionnelle n'est pas forcément fabriqué au Japon, et beaucoup de boutiques entretiennent ce flou. Autant l'écrire : nos éventails sont de style japonais par la forme et le mécanisme, et ils sont conçus et fabriqués en France. Ni la monture, ni le papier, ni l'assemblage ne viennent du Japon.</p><p>Ce n'est pas un aveu, c'est une information. Un objet dont on connaît l'origine vaut mieux qu'un objet dont on la devine.</p><p>Si vous cherchez un modèle pliant dont vous choisissez la monture, la couleur du papier, le motif et la finition des vis, c'est ce que propose notre <a href=\"/fr/categories/eventail-japonais\">sélection d'éventails japonais</a>, à configurer en 3D avant commande.</p>",
      },
    ],
  },

  {
    slug: "wagasa-ombrelle-japonaise-ancienne",
    title: "Wagasa : l'ombrelle japonaise ancienne en papier",
    excerpt:
      "Bambou, papier washi, huile de périlla : comment se fabrique une wagasa, pourquoi elle a presque disparu, et ce qui la distingue d'une ombrelle moderne.",
    category: "Culture",
    read_time: "5 min",
    date: "1 septembre 2026",
    date_iso: "2026-09-01",
    blocks: [
      {
        type: "texte",
        content:
          "La wagasa (和傘) est l'ombrelle japonaise traditionnelle : une armature de bambou, un papier washi tendu dessus, imperméabilisé à l'huile. Elle a presque disparu de l'usage courant, et les raisons de cette disparition en disent long sur ce qu'elle était.",
        dropcap: true,
      },
      { type: "titre", level: 2, text: "Trois matières, une centaine d'étapes" },
      {
        type: "texte",
        content:
          "<p>Une wagasa n'est pas un objet manufacturé. L'armature compte plusieurs dizaines de baleines de bambou refendues à la main, assemblées par un fil qui les maintient à égale tension. Le papier washi, fabriqué à partir de fibres de mûrier, est collé section par section.</p><p>Vient ensuite l'huile — traditionnellement de périlla — qui rend le papier translucide et résistant à l'eau. C'est cette huile qui donne à une wagasa sa lumière particulière quand le soleil la traverse.</p><p>L'ensemble représente une centaine d'étapes réparties entre plusieurs artisans spécialisés. Cette division du travail explique à la fois la qualité de l'objet et sa fragilité économique.</p>",
      },
      { type: "titre", level: 2, text: "Bangasa, janome, higasa : trois usages" },
      {
        type: "texte",
        content:
          "<p>La bangasa est la version robuste et masculine, à baleines épaisses, longtemps prêtée par les commerces à leurs clients. La janome — « œil de serpent » — porte un cercle contrasté sur sa toile et reste la plus reconnaissable. La higasa, enfin, est une ombrelle de soleil, plus légère, jamais destinée à la pluie.</p><p>Cette dernière distinction compte : en japonais comme en français, l'ombrelle et le parapluie sont deux objets. Une higasa mouillée est une higasa abîmée.</p>",
      },
      { type: "titre", level: 2, text: "Pourquoi elle a reculé" },
      {
        type: "texte",
        content:
          "<p>Le parapluie occidental, à armature métallique et toile synthétique, est arrivé à la fin du XIXᵉ siècle. Moins cher, plus solide sous la pluie, réparable ou jetable. La wagasa est devenue un objet de cérémonie, de théâtre et de maison de thé.</p><p>Il reste aujourd'hui une poignée d'ateliers, concentrés autour de Gifu et de Kyoto. Une wagasa neuve se compte en centaines d'euros, ce qui la place hors du champ de l'objet du quotidien.</p>",
      },
      { type: "titre", level: 2, text: "Reconnaître une wagasa d'une imitation" },
      {
        type: "texte",
        content:
          "<p>Le nombre de baleines est le premier indice. Une wagasa en compte typiquement entre trente et soixante-dix, contre huit à dix sur un parapluie occidental. Cette densité produit la nervure serrée, visible par transparence, qui fait sa signature.</p><p>Le son ensuite. Le bambou et le papier huilé claquent sèchement à l'ouverture ; une toile synthétique sur armature métallique fait un bruit mat, plus sourd.</p><p>La lumière, enfin. Un washi huilé laisse passer le jour en le colorant, tandis qu'une toile imprimée l'arrête. Tenez l'ombrelle à contre-jour : si la structure des fibres apparaît, le papier est vrai.</p><p>Ces trois tests ne demandent aucune expertise. Ils suffisent à distinguer un objet d'atelier d'une décoration vendue comme telle — ce qui reste parfaitement légitime, tant que le vendeur ne prétend pas le contraire.</p>",
      },
      { type: "titre", level: 2, text: "Ce que nous fabriquons — et ce que non" },
      {
        type: "texte",
        content:
          "<p>Autant être net : nos ombrelles ne sont pas des wagasa. Elles n'utilisent ni le bambou refendu, ni le washi huilé, ni les cent étapes décrites plus haut. Elles s'en inspirent par la silhouette, et elles sont conçues et fabriquées en France.</p><p>Ce que nous proposons, c'est autre chose : une <a href=\"/fr/products/ombrelle\">ombrelle japonaise à configurer</a> — couleur, toile, gravure du manche — dont vous voyez le rendu en 3D avant qu'elle ne soit fabriquée. Un objet contemporain de forme japonaise, pas une reproduction d'artisanat ancien.</p><p>Si c'est une wagasa authentique que vous cherchez, il faut se tourner vers les ateliers japonais qui la fabriquent encore. Nous ne prétendrons pas faire ce travail.</p>",
      },
    ],
  },

  {
    slug: "comment-tenir-des-baguettes-japonaises",
    title: "Comment tenir des baguettes japonaises sans forcer",
    excerpt:
      "La position exacte des doigts, la baguette qui bouge et celle qui ne bouge pas, les trois erreurs fréquentes et ce qu'on ne fait jamais à table.",
    category: "Tuto",
    read_time: "4 min",
    date: "29 août 2026",
    date_iso: "2026-08-29",
    blocks: [
      {
        type: "texte",
        content:
          "Le geste tient en une phrase : une baguette reste immobile, l'autre bouge. Presque toutes les difficultés viennent d'avoir voulu faire bouger les deux.",
        dropcap: true,
      },
      { type: "titre", level: 2, text: "La baguette du bas ne bouge jamais" },
      {
        type: "texte",
        content:
          "<p>Posez la première baguette dans le creux entre le pouce et l'index, et laissez-la reposer sur la dernière phalange de l'annulaire. Elle est maintenant coincée entre deux appuis fixes. Elle ne bougera plus de tout le repas.</p><p>C'est le point que la plupart des débutants ratent : ils la tiennent avec le majeur, qui bouge, et perdent la stabilité dès qu'ils serrent.</p>",
      },
      { type: "titre", level: 2, text: "La baguette du haut se tient comme un stylo" },
      {
        type: "texte",
        content:
          "<p>La seconde se prend entre le pouce, l'index et le majeur, exactement comme un crayon. C'est elle qui descend vers la baguette fixe pour pincer.</p><p>Le mouvement vient de l'index et du majeur qui se déplient et se replient. Le poignet ne travaille pas. Si votre poignet bouge, la prise est trop crispée.</p>",
      },
      { type: "titre", level: 2, text: "Les trois erreurs fréquentes" },
      {
        type: "texte",
        content:
          "<p><strong>Tenir trop près des pointes.</strong> On y gagne en précision apparente et on y perd toute l'ouverture. La prise se fait au tiers supérieur, pas au milieu et encore moins au bout.</p><p><strong>Croiser les baguettes.</strong> Si elles se croisent au lieu de se rejoindre, c'est que la baguette du bas a bougé. Reposez tout et recommencez : compenser en tordant le poignet ne fait qu'installer le défaut.</p><p><strong>Serrer.</strong> Une bouchée se pince, elle ne s'écrase pas. Une main crispée fatigue en trois minutes et fait tomber ce qu'elle attrape.</p>",
      },
      { type: "titre", level: 2, text: "Ce qu'on ne fait pas à table" },
      {
        type: "texte",
        content:
          "<p>Ne plantez jamais les baguettes verticalement dans le riz : ce geste reproduit une offrande funéraire et met tout le monde mal à l'aise. Ne les posez pas non plus en travers du bol — un repose-baguettes, ou le bord d'une assiette, fait l'affaire.</p><p>On ne se passe pas non plus une bouchée de baguettes à baguettes, pour la même raison funéraire. Et on évite de pointer quelqu'un avec, comme on éviterait de le faire avec une fourchette.</p>",
      },
      { type: "titre", level: 2, text: "S'entraîner en trois séances" },
      {
        type: "texte",
        content:
          "<p>Inutile d'attendre le prochain restaurant japonais. La progression classique tient en trois exercices, à faire à sec.</p><p><strong>Un.</strong> Tenez la seule baguette du bas, sans la seconde, et gardez-la immobile en bougeant la main. Tant qu'elle roule ou glisse, la base n'est pas acquise et le reste ne suivra pas.</p><p><strong>Deux.</strong> Ajoutez la baguette du haut et ouvrez-fermez à vide, une trentaine de fois. L'objectif n'est pas d'attraper quoi que ce soit, mais de sentir que seuls l'index et le majeur travaillent.</p><p><strong>Trois.</strong> Attrapez des objets de taille décroissante : un bouchon, une pièce de monnaie, un grain de riz. Le riz vient en dernier parce qu'il exige une précision que les deux premiers exercices construisent.</p><p>Compter en séances plutôt qu'en semaines évite le découragement : la plupart des adultes tiennent correctement au bout de la deuxième.</p>",
      },
      { type: "titre", level: 2, text: "Le matériel joue aussi" },
      {
        type: "texte",
        content:
          "<p>Une paire trop lisse glisse, une paire trop lourde fatigue. Le bois brut accroche mieux qu'une laque très polie, ce qui aide considérablement au début.</p><p>Si vous voulez une paire dont vous choisissez la teinte et la finition — et éventuellement une gravure — c'est ce que propose notre <a href=\"/fr/categories/baguettes-japonaises\">sélection de baguettes japonaises</a>, à configurer avant fabrication.</p>",
      },
    ],
  },

  {
    slug: "cadeau-japonais-ado",
    title: "Cadeau japonais ado : ce qui passe, ce qui rate",
    excerpt:
      "Snacks, papeterie, produits dérivés : ce qui marche auprès d'un adolescent selon son rapport réel au Japon, et ce qui finit au fond d'un tiroir.",
    category: "Guide",
    read_time: "4 min",
    date: "26 août 2026",
    date_iso: "2026-08-26",
    blocks: [
      {
        type: "texte",
        content:
          "Offrir « quelque chose de japonais » à un adolescent suppose une chose qu'on vérifie rarement : que son intérêt porte sur le Japon, et non sur un manga précis, un jeu précis ou un groupe précis. La nuance décide du cadeau.",
        dropcap: true,
      },
      { type: "titre", level: 2, text: "D'abord, situer l'intérêt" },
      {
        type: "texte",
        content:
          "<p>Trois cas très différents se cachent derrière la même phrase. L'ado qui aime <em>un</em> manga voudra quelque chose lié à cette œuvre — un objet japonais générique lui paraîtra à côté de la plaque. Celui qui apprend la langue ou prévoit un voyage a un intérêt pour le pays lui-même. Celui qui aime l'esthétique, enfin, réagira à un objet bien dessiné sans se soucier de sa provenance.</p><p>Le premier cas est le plus fréquent, et c'est celui où le cadeau « japonais » échoue le plus souvent.</p>",
      },
      { type: "titre", level: 2, text: "Ce qui fonctionne" },
      {
        type: "texte",
        content:
          "<p><strong>La papeterie.</strong> Stylos, carnets, gommes : c'est le rayon où le Japon a une avance réelle et visible, et un adolescent s'en sert tous les jours.</p><p><strong>Les snacks.</strong> Peu engageants, souvent drôles, ils se partagent — donc ils circulent, ce qui compte à cet âge.</p><p><strong>Un objet lié à une pratique.</strong> Si l'ado cuisine, dessine, ou reçoit des amis, un objet qui sert dans cette pratique a beaucoup plus de chances qu'un objet à contempler.</p>",
      },
      { type: "titre", level: 2, text: "Ce qui rate" },
      {
        type: "texte",
        content:
          "<p><strong>Le kimono ou le yukata bon marché.</strong> Encombrant, rarement porté, et souvent perçu comme un déguisement plutôt que comme un vêtement.</p><p><strong>Le « kit découverte ».</strong> Assortiment d'objets sans lien entre eux, qui donne le sentiment d'un cadeau choisi à la va-vite — ce qu'il est généralement.</p><p><strong>Le produit dérivé approximatif.</strong> Un adolescent reconnaît immédiatement un objet sous licence d'un objet qui ne l'est pas. Le second déçoit plus qu'il ne fait plaisir.</p>",
      },
      { type: "titre", level: 2, text: "Le budget compte moins qu'on ne croit" },
      {
        type: "texte",
        content:
          "<p>Un adolescent n'évalue pas un cadeau à son prix, mais à ce qu'il révèle de l'attention qu'on lui a portée. Un objet à quinze euros qui tombe juste bat un objet à cent euros choisi au hasard — c'est une constante que les parents redécouvrent chaque année.</p><p>Le prix devient visible dans un seul cas : quand il est manifestement trop bas pour l'occasion, ou manifestement trop haut au point de créer une gêne. Entre les deux, ce qui se voit, c'est la justesse.</p><p>La conséquence pratique est simple : mieux vaut consacrer du temps à comprendre l'intérêt réel que du budget à compenser une hésitation. Une heure passée à écouter de quoi il parle vaut cinquante euros de plus sur le cadeau.</p>",
      },
      { type: "titre", level: 2, text: "Et nos objets, dans tout ça ?" },
      {
        type: "texte",
        content:
          "<p>Soyons honnêtes sur le sujet. Des baguettes, un éventail ou une ombrelle de style japonais ne sont pas un cadeau évident pour un adolescent de quinze ans qui suit une série. Ils fonctionnent dans un cas précis : quand l'intérêt porte sur le pays ou sur l'objet bien fait, pas sur une œuvre.</p><p>Dans ce cas, la gravure change la donne — un prénom transforme un objet de catalogue en objet qui lui appartient. Nos <a href=\"/fr/offrir\">idées cadeaux à faire graver</a> partent de cette logique.</p><p>Si l'intérêt de l'ado porte sur une œuvre en particulier, mieux vaut chercher de ce côté-là. Un cadeau juste vaut mieux qu'un cadeau thématique.</p>",
      },
    ],
  },

  {
    slug: "objet-grave-ou-imprime-difference",
    title: "Objet gravé, objet imprimé : quelle différence ?",
    excerpt:
      "Gravure ou impression : ce que recouvre chaque terme, ce que chacun tient dans le temps, et pourquoi le mot « personnalisé » ne veut presque rien dire.",
    category: "Guide",
    read_time: "5 min",
    date: "22 août 2026",
    date_iso: "2026-08-22",
    blocks: [
      {
        type: "texte",
        content:
          "« Personnalisé » est devenu un mot vide. Il désigne aussi bien un prénom gravé dans la matière qu'un motif imprimé sur un objet de série. Les deux se vendent au même rayon et ne durent pas du tout aussi longtemps.",
        dropcap: true,
      },
      { type: "titre", level: 2, text: "Graver, c'est enlever de la matière" },
      {
        type: "texte",
        content:
          "<p>Un objet gravé porte un creux. Le motif n'est pas posé sur la surface, il est retiré de la surface — au laser, à la fraise ou à l'outil. Il ne peut donc ni s'écailler, ni se décoller, ni passer au lavage.</p><p>La contrepartie est double : la gravure est monochrome, et elle est définitive. Pas de couleur, pas de correction possible. C'est un engagement, ce qui fait à la fois sa valeur et son risque.</p>",
      },
      { type: "titre", level: 2, text: "Imprimer, c'est ajouter par-dessus" },
      {
        type: "texte",
        content:
          "<p>L'impression dépose une couche : encre, transfert, sublimation. Elle autorise la couleur, la photo, les dégradés, et coûte nettement moins cher en petite série.</p><p>Mais une couche déposée s'use. Un mug imprimé passé cinquante fois au lave-vaisselle perd son motif ; un mug gravé le garde. C'est la seule question qui compte vraiment au moment de choisir : est-ce que cet objet va être manipulé ?</p>",
      },
      { type: "titre", level: 2, text: "Les limites qu'on ne vous dit pas" },
      {
        type: "texte",
        content:
          "<p>Une gravure n'accepte pas une photo. Elle rend mal les dégradés, les traits fins et les aplats étendus. Sur un objet de petite taille, elle n'accepte guère plus qu'une ligne de texte lisible.</p><p>C'est pour cette raison que nos pièces se limitent à un texte court : un prénom, une date, quelques mots. Promettre un dessin d'enfant gravé sur une paire de baguettes serait promettre une déception.</p>",
      },
      { type: "titre", level: 2, text: "Configurer n'est pas graver" },
      {
        type: "texte",
        content:
          "<p>Il existe un troisième registre, qu'on confond souvent avec les deux premiers : configurer. Choisir la matière, la teinte, le motif et la finition d'un objet avant qu'il ne soit fabriqué, ce n'est ni graver ni imprimer — c'est décider de l'objet lui-même.</p><p>Sur nos pièces, les deux se cumulent : vous configurez d'abord, vous ajoutez éventuellement une gravure ensuite. La configuration porte sur l'objet, la gravure sur ce qu'il raconte.</p><p>C'est visible directement sur les fiches : <a href=\"/fr/categories/baguettes-japonaises\">baguettes</a>, <a href=\"/fr/categories/eventail-japonais\">éventails</a> et <a href=\"/fr/products/ombrelle\">ombrelle</a> se configurent en 3D avant fabrication.</p>",
      },
      { type: "titre", level: 2, text: "Quand la gravure est un mauvais choix" },
      {
        type: "texte",
        content:
          "<p>La gravure a mauvaise presse dans trois situations, et il vaut mieux les connaître avant de payer.</p><p><strong>Quand le texte peut vieillir.</strong> Un prénom de couple gravé sur un objet du quotidien devient encombrant si la relation s'arrête. Une date de naissance, non. Le critère est simple : gravez ce qui ne peut pas changer.</p><p><strong>Quand l'objet risque d'être revendu ou transmis.</strong> Un objet gravé perd toute valeur de revente. C'est justement ce qui en fait un cadeau — mais c'est un problème si le destinataire déménage souvent ou se sépare volontiers de ses affaires.</p><p><strong>Quand on n'est pas sûr de l'orthographe.</strong> Une gravure ne se corrige pas. Un prénom mal orthographié transforme le cadeau en anecdote gênante, définitivement.</p><p>Dans ces trois cas, l'objet configuré sans gravure garde l'essentiel : il a quand même été choisi, teinte par teinte, pour quelqu'un.</p>",
      },
      { type: "titre", level: 2, text: "Comment choisir, en une question" },
      {
        type: "texte",
        content:
          "<p>Si l'objet doit survivre à un usage quotidien, gravez. S'il doit porter une image, une couleur ou un visage, imprimez. Si vous hésitez parce que l'objet est décoratif et peu manipulé, l'impression suffira et coûtera moins cher.</p><p>Le seul mauvais choix est de payer le prix d'un objet gravé pour recevoir un objet imprimé. Vérifiez le mot employé — et s'il n'est pas employé, demandez.</p>",
      },
    ],
  },
];

export default async function seed_editorial_articles({
  container,
}: {
  container: MedusaContainer;
}) {
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER);
  const blogService: BlogModuleService = container.resolve(BLOG_MODULE);

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
    `Éditorial : ${created} article(s) créé(s), ${skipped} déjà présent(s).`
  );
}
