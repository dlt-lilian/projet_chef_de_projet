const checkEnvVariables = require("./check-env-variables")
const { IMAGE_HOSTS } = require("./src/lib/util/image-hosts")

checkEnvVariables()

/**
 * Medusa Cloud-related environment variables
 */
const S3_HOSTNAME = process.env.MEDUSA_CLOUD_S3_HOSTNAME
const S3_PATHNAME = process.env.MEDUSA_CLOUD_S3_PATHNAME

/**
 * @type {import('next').NextConfig}
 */
const nextConfig = {
  reactStrictMode: true,
  logging: {
    fetches: {
      fullUrl: true,
    },
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    // Optimisation activée (AVIF/WebP + redimensionnement responsive). Les images
    // produit sont servies depuis R2 (public) → optimisées côté serveur Railway.
    //
    // La liste d'hôtes vit dans `src/lib/util/image-hosts.js` et NON ici, parce
    // que le rendu a besoin de la même information : un `src` dont l'hôte est
    // absent de `remotePatterns` fait *planter* la page (next/image lève une
    // erreur, pas juste une image cassée). Les composants interrogent donc
    // `isOptimizable()` — adossé à cette même liste — pour retomber sur
    // `unoptimized` au lieu de casser. Voir @lib/util/images.
    formats: ["image/avif", "image/webp"],
    // Les visuels éditoriaux changent rarement mais sont lourds à réencoder :
    // 30 jours de cache évitent de refaire le travail à chaque déploiement et
    // à chaque expiration (le défaut de Next est de 60 secondes).
    minimumCacheTTL: 60 * 60 * 24 * 30,
    remotePatterns: [
      ...IMAGE_HOSTS,
      ...(S3_HOSTNAME && S3_PATHNAME
        ? [
            {
              protocol: "https",
              hostname: S3_HOSTNAME,
              pathname: S3_PATHNAME,
            },
          ]
        : []),
    ],
  },
  /**
   * Redirections permanentes.
   *
   * Next émet un 308 pour `permanent: true` (et non un 301) : Google les traite
   * de façon identique pour la consolidation d'URL, et c'est déjà le code
   * qu'utilise le middleware pour le préfixe pays — une seule sémantique sur
   * tout le site.
   *
   * Les règles à `:countryCode` sont évaluées AVANT le middleware (ordre Next :
   * redirects → middleware), donc une URL déjà préfixée est redirigée en un
   * seul saut. Les variantes sans pays passent par un second saut, ajouté par
   * le middleware.
   */
  async redirects() {
    return [
      // « ombrelle japonaise » vaut 1 000 recherches mensuelles contre 65 pour
      // « parapluie japonais » — dont l'essentiel relève de l'entomologie.
      // Le produit a été renommé ; cette règle préserve l'historique de l'URL.
      {
        source: "/:countryCode/products/parapluie",
        destination: "/:countryCode/products/ombrelle",
        permanent: true,
      },
      {
        source: "/products/parapluie",
        destination: "/products/ombrelle",
        permanent: true,
      },

      // Produits de l'ancien système 3D, supprimés par
      // `seed-configurator-products` : leurs URL répondaient 404. On récupère
      // le peu d'autorité qu'elles portent encore vers la fiche équivalente.
      {
        source: "/:countryCode/products/parapluie-japonais",
        destination: "/:countryCode/products/ombrelle",
        permanent: true,
      },
      {
        source: "/:countryCode/products/baguettes-japonaises",
        destination: "/:countryCode/products/baguettes",
        permanent: true,
      },
      {
        source: "/:countryCode/products/eventail-japonais",
        destination: "/:countryCode/products/eventail",
        permanent: true,
      },
      // « pack-kogei » n'a pas de successeur : la boutique est la destination
      // la moins trompeuse (rediriger vers une fiche sans rapport serait un
      // soft-404 aux yeux de Google).
      {
        source: "/:countryCode/products/pack-kogei",
        destination: "/:countryCode/store",
        permanent: true,
      },
    ]
  },
  webpack(config) {
    config.module.rules.push({
      test: /\.(glb|gltf)$/,
      type: "asset/resource",
    })
    return config
  },
}

module.exports = nextConfig
