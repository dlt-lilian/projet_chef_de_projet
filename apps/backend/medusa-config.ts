import { loadEnv, defineConfig } from '@medusajs/framework/utils'

loadEnv(process.env.NODE_ENV || 'development', process.cwd())

module.exports = defineConfig({
  projectConfig: {
    databaseUrl: process.env.DATABASE_URL,
    workerMode: (process.env.MEDUSA_WORKER_MODE as "shared" | "server" | "worker") || "shared",
    http: {
      storeCors: process.env.STORE_CORS!,
      adminCors: process.env.ADMIN_CORS!,
      authCors: process.env.AUTH_CORS!,
      jwtSecret: process.env.JWT_SECRET || "supersecret",
      cookieSecret: process.env.COOKIE_SECRET || "supersecret",
    }
  },
  admin: {
    disable: process.env.DISABLE_MEDUSA_ADMIN === "true",
  },
  featureFlags: {
    // Ajoute le sélecteur de colonnes aux tableaux Commandes et Produits.
    // Nécessaire pour masquer « Livraison » et afficher le statut de
    // fabrication à la place. Fonctionnalité marquée expérimentale par Medusa
    // depuis la 2.10.3.
    view_configurations: true,
  },
  modules: [
    {
      resolve: "./src/modules/blog",
    },
    {
      resolve: "./src/modules/configurator",
    },
    {
      resolve: "./src/modules/slider",
    },
    {
      resolve: "./src/modules/gallery",
    },
    {
      resolve: "./src/modules/production",
    },
    ...(process.env.S3_BUCKET
      ? [
          {
            resolve: "@medusajs/medusa/file",
            options: {
              providers: [
                {
                  resolve: "@medusajs/medusa/file-s3",
                  id: "s3",
                  options: {
                    file_url: process.env.S3_FILE_URL,
                    access_key_id: process.env.S3_ACCESS_KEY_ID,
                    secret_access_key: process.env.S3_SECRET_ACCESS_KEY,
                    region: process.env.S3_REGION || "auto",
                    bucket: process.env.S3_BUCKET,
                    endpoint: process.env.S3_ENDPOINT,
                    additional_client_config: {
                      forcePathStyle: true,
                    },
                  },
                },
              ],
            },
          },
        ]
      : []),
    ...(process.env.REDIS_URL
      ? [
          {
            resolve: "@medusajs/medusa/cache-redis",
            options: { redisUrl: process.env.REDIS_URL },
          },
          {
            resolve: "@medusajs/medusa/event-bus-redis",
            options: { redisUrl: process.env.REDIS_URL },
          },
          {
            resolve: "@medusajs/medusa/workflow-engine-redis",
            options: { redis: { url: process.env.REDIS_URL } },
          },
        ]
      : []),
  ],
})