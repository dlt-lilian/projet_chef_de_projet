/**
 * Source unique de vérité des hôtes d'images optimisables.
 *
 * Ce fichier est en CommonJS et sans dépendance TS parce qu'il a DEUX
 * consommateurs qui ne partagent pas le même pipeline :
 *   - `next.config.js` (Node, au build) → construit `images.remotePatterns` ;
 *   - `@lib/util/images` (bundle, au rendu) → décide `unoptimized` par image.
 *
 * Les deux DOIVENT rester d'accord : next/image lève une erreur (page cassée,
 * pas juste une image manquante) si le host d'un `src` non-`unoptimized` n'est
 * pas dans remotePatterns. Une liste dupliquée finirait par diverger — d'où ce
 * module unique.
 *
 * AJOUTER UN HÔTE : une ligne dans IMAGE_HOSTS suffit, les deux côtés suivent.
 */

/** @typedef {{ protocol: "http" | "https", hostname: string }} HostPattern */

/**
 * Syntaxe des jokers = celle de next/image :
 *   `*`  → un seul segment de sous-domaine
 *   `**` → un nombre quelconque de segments
 *
 * Volontairement une liste fermée, et non `{ hostname: "**" }` : le
 * redimensionneur de next/image sert TOUTE URL correspondant à un motif, pas
 * seulement celles que le site affiche. Un joker total en ferait un proxy
 * d'images ouvert — quelconque tiers pourrait faire redimensionner ses propres
 * images par le serveur Railway, à nos frais de CPU et de bande passante.
 */
/** @type {HostPattern[]} */
const IMAGE_HOSTS = [
  // Développement local (backend Medusa qui sert les uploads).
  { protocol: "http", hostname: "localhost" },

  // Cloudflare R2 public — images produit, slider, couvertures d'articles.
  { protocol: "https", hostname: "**.r2.dev" },

  // S3 (Medusa Cloud et self-hosted).
  { protocol: "https", hostname: "*.s3.*.amazonaws.com" },
  { protocol: "https", hostname: "*.s3.amazonaws.com" },

  // Banques d'images référencées depuis l'admin (galerie d'accueil, articles).
  // Sans elles, ces visuels repassent en `unoptimized`, donc servis aux octets
  // d'origine : une photo Pexels brute atteint 5 Mo pour une vignette de 450 px.
  { protocol: "https", hostname: "images.pexels.com" },

  // Placeholders des jeux de données de démonstration (FALLBACK_SLIDES /
  // FALLBACK_IMAGES), affichés tant que l'admin n'a rien enregistré.
  { protocol: "https", hostname: "picsum.photos" },
  { protocol: "https", hostname: "*.picsum.photos" },
]

// Marqueurs volontairement composés de `_` et de lettres : aucun n'appartient
// à la classe échappée plus bas, ils traversent donc l'échappement intacts. Ils
// ne peuvent pas non plus entrer en collision avec un hostname réel, où `_`
// n'est pas un caractère valide.
const DOUBLE = "__WILDCARD_DOUBLE__"
const SINGLE = "__WILDCARD_SINGLE__"

/**
 * Traduit un `hostname` façon next/image en expression régulière ancrée.
 *
 * L'ancrage `^...$` est ce qui rend la liste sûre : sans lui,
 * `images.pexels.com.attaquant.net` passerait le test.
 */
function hostnameToRegExp(pattern) {
  // Les jokers sont mis de côté AVANT l'échappement (sinon `*` serait échappé
  // en littéral), puis réinjectés en motifs regex après.
  const masked = pattern.split("**").join(DOUBLE).split("*").join(SINGLE)
  const escaped = masked.replace(/[.+?^${}()|[\]\\]/g, "\\$&")
  const source = escaped
    .split(DOUBLE)
    .join(".*") // `**` : n'importe quel nombre de segments
    .split(SINGLE)
    .join("[^.]*") // `*` : un seul segment (pas de point)
  return new RegExp("^" + source + "$")
}

const COMPILED = IMAGE_HOSTS.map((p) => hostnameToRegExp(p.hostname))

/** Le host donné est-il couvert par un motif de la liste ? */
function isAllowedImageHost(hostname) {
  return COMPILED.some((re) => re.test(hostname))
}

module.exports = { IMAGE_HOSTS, isAllowedImageHost }
