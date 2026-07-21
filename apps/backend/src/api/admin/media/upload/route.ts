import type {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3"
import { randomUUID } from "crypto"
import path from "path"

/**
 * POST /admin/media/upload  (multipart : `files` + `folder`)
 *
 * Upload GÉNÉRIQUE d'un fichier vers R2 dans le DOSSIER choisi. Reprend la
 * logique de l'ancienne route configurator, mais avec une whitelist de dossiers
 * ÉLARGIE aux zones éditables du storefront (3D, Slider, Gallery, Blog…), pour
 * être réutilisée par tous les écrans admin (configurateur, slider, galerie,
 * blog…). Renvoie { url, key }.
 */

type UploadedFile = { originalname: string; mimetype: string; buffer: Buffer }

// Sécurité : le dossier doit commencer par un préfixe de 1er niveau autorisé,
// puis uniquement des segments simples (alphanum + espace/underscore/tiret).
// Interdit de fait les ".." et les chemins absolus.
const SAFE_FOLDER = /^(3D|Slider|Gallery|Blog)(\/[A-Za-z0-9][A-Za-z0-9 _-]*)*$/

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

  const folder = String((req.body as { folder?: string })?.folder ?? "")
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
