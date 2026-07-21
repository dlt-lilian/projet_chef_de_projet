import type {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import { CONFIGURATOR_MODULE } from "../../../../modules/configurator"
import type ConfiguratorModuleService from "../../../../modules/configurator/service"

/**
 * GET /admin/configurator/meshes?glb=<chemin|url>  (ou ?product_id=<id>)
 * Renvoie les noms d'objets et de matériaux contenus dans le .glb, pour
 * alimenter le menu déroulant de `target_mesh` dans l'admin.
 *
 * `target_mesh` matche côté storefront soit le nom d'un objet (node/mesh),
 * soit le nom d'un matériau (cf. findMeshes dans three-helpers.ts).
 */

// Résout un glb_path (URL absolue R2, ou chemin /3d/… relatif au storefront)
// en une URL fetchable côté serveur.
function resolveGlbUrl(glb: string): string {
  if (/^https?:\/\//i.test(glb)) return glb
  const base = (
    process.env.STOREFRONT_URL ||
    (process.env.STORE_CORS || "")
      .split(",")
      .map((s) => s.trim())
      .find((o) => o && !o.includes("docs.medusajs.com")) ||
    "http://localhost:8000"
  ).replace(/\/+$/, "")
  return `${base}/${glb.replace(/^\/+/, "")}`
}

// Parse le chunk JSON d'un binaire GLB et en extrait les noms.
function extractGlbNames(buf: Buffer): {
  objects: string[]
  materials: string[]
} {
  if (buf.length < 20 || buf.readUInt32LE(0) !== 0x46546c67) {
    throw new Error("Fichier .glb invalide (en-tête manquant).")
  }
  const chunkLength = buf.readUInt32LE(12)
  const chunkType = buf.readUInt32LE(16)
  if (chunkType !== 0x4e4f534a) {
    throw new Error("Chunk JSON introuvable dans le .glb.")
  }
  const json = JSON.parse(buf.subarray(20, 20 + chunkLength).toString("utf8"))
  const names = (arr: unknown): string[] =>
    Array.isArray(arr)
      ? arr
          .map((x) => (x as { name?: string })?.name)
          .filter((n): n is string => typeof n === "string" && n.length > 0)
      : []
  const objects = [...new Set([...names(json.nodes), ...names(json.meshes)])]
  const materials = [...new Set(names(json.materials))]
  return { objects, materials }
}

export const GET = async (
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse
) => {
  const { glb, product_id } = req.query as {
    glb?: string
    product_id?: string
  }

  let glbPath = glb
  if (!glbPath && product_id) {
    const svc: ConfiguratorModuleService = req.scope.resolve(CONFIGURATOR_MODULE)
    const [product] = await svc.listConfiguratorProducts({ id: product_id })
    glbPath = product?.glb_path
  }
  if (!glbPath) {
    return res
      .status(400)
      .json({ message: "Paramètre `glb` ou `product_id` requis." })
  }

  try {
    const url = resolveGlbUrl(glbPath)
    const r = await fetch(url)
    if (!r.ok) {
      throw new Error(`.glb inaccessible (HTTP ${r.status}) : ${url}`)
    }
    const buf = Buffer.from(await r.arrayBuffer())
    const { objects, materials } = extractGlbNames(buf)
    res.json({ objects, materials })
  } catch (e) {
    res.status(422).json({
      message: e instanceof Error ? e.message : "Lecture du .glb impossible.",
    })
  }
}
