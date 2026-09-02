const checkEnvVariables = require("./check-env-variables")

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
    // NB : les images de BLOG (contenu éditorial, hôtes potentiellement arbitraires)
    // portent la prop `unoptimized` sur leur <Image> — sinon un hôte non listé ici
    // ferait *planter* la page (next/image lève une erreur, pas juste une image cassée).
    formats: ["image/avif", "image/webp"],
    remotePatterns: [
      {
        protocol: "http",
        hostname: "localhost",
      },
      {
        // Cloudflare R2 public (pub-<hash>.r2.dev) — images produit & assets.
        protocol: "https",
        hostname: "**.r2.dev",
      },
      {
        protocol: "https",
        hostname: "*.s3.*.amazonaws.com",
      },
      {
        protocol: "https",
        hostname: "*.s3.amazonaws.com",
      },
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
