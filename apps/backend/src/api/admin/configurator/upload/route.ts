import type {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3"
import { randomUUID } from "crypto"
import path from "path"

/**
 * POST /admin/configurator/upload  (multipart : `files` + `folder`)
 * Upload une image/texture vers R2 dans le DOSSIER choisi (ex.
 * "3D/Textures/General" ou "3D/Textures/Eventail"), contrairement à
 * /admin/uploads qui écrit toujours à la racine.
 * Renvoie { url, key }.
 */

type UploadedFile = { originalname: string; mimetype: string; buffer: Buffer }

// Sécurité : uniquement des dossiers sous 3D/ (pas de "..", pas de chemin absolu).
const SAFE_FOLDER = /^3D(\/[A-Za-z0-9][A-Za-z0-9 _-]*)*$/

export const POST = async (
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse
) => {
  if (!process.env.S3_BUCKET) {
    return res
      .status(400)
      .json({ message: "Stockage S3 non configuré (S3_BUCKET manquant)." })
  }

  const files = (req as unknown as { files?: UploadedFile[] }).files
  const file = files?.[0]
  if (!file) {
    return res.status(400).json({ message: "Aucun fichier fourni (champ « files »)." })
  }

  const folder = String((req.body as { folder?: string })?.folder ?? "3D/Textures/General")
    .trim()
    .replace(/^\/+|\/+$/g, "")
  if (!SAFE_FOLDER.test(folder)) {
    return res.status(400).json({ message: `Dossier invalide : « ${folder} ».` })
  }

  const parsed = path.parse(file.originalname)
  const name = parsed.name.replace(/[^A-Za-z0-9_-]/g, "_") || "fichier"
  const key = `${folder}/${name}-${randomUUID()}${parsed.ext.toLowerCase()}`

  const client = new S3Client({
    region: process.env.S3_REGION || "auto",
    endpoint: process.env.S3_ENDPOINT,
    forcePathStyle: true,
    credentials: {
      accessKeyId: process.env.S3_ACCESS_KEY_ID as string,
      secretAccessKey: process.env.S3_SECRET_ACCESS_KEY as string,
    },
  })

  try {
    await client.send(
      new PutObjectCommand({
        Bucket: process.env.S3_BUCKET,
        Key: key,
        Body: file.buffer,
        ContentType: file.mimetype,
        ACL: "public-read",
        CacheControl: "public, max-age=31536000",
      })
    )
  } catch (e) {
    return res.status(502).json({
      message: e instanceof Error ? e.message : "Échec de l'envoi vers R2.",
    })
  }

  const base = (process.env.S3_FILE_URL || "").replace(/\/+$/, "")
  res.status(201).json({ url: `${base}/${key}`, key })
}
