import {
  Box3,
  CanvasTexture,
  Euler,
  Group,
  Matrix4,
  Mesh,
  MeshStandardMaterial,
  Object3D,
  Raycaster,
  SRGBColorSpace,
  Vector3,
} from "three"
import { DecalGeometry } from "three/examples/jsm/geometries/DecalGeometry.js"
import type { EngravingPreviewConfig } from "./engraving-preview"
import { findMeshes, type MeshLayers } from "./three-helpers"

/**
 * Aperçu 3D de la gravure — PROTOTYPE (baguettes uniquement).
 *
 * Pourquoi un décalque projeté et non un calque de plus sur la texture composée
 * (`compositeLayers`) : les UV du GLB des baguettes sont inexploitables pour du
 * texte. `TEXCOORD_0` est un atlas écrasé dans une bande de 17 % de hauteur,
 * `TEXCOORD_1` (celui des textures d'origine) est répété en mosaïque et n'est
 * pas aligné sur la longueur. Un texte dessiné dans l'une ou l'autre sortirait
 * morcelé. Le décalque projette le texte sur la géométrie elle-même, sans
 * dépendre des UV.
 *
 * Le placement est calculé, pas saisi : pour chaque mesh on trouve l'axe
 * principal (ACP des sommets), le bout épais (le manche), puis on projette le
 * texte sur la face tournée vers la caméra de la vue initiale. Aucune
 * coordonnée propre au modèle n'est donc codée en dur — seuls des ratios
 * (cf. `engraving-preview.ts`).
 */
export type { EngravingPreviewConfig }

/** Résolution verticale du canvas du texte (la largeur suit le ratio). */
const CANVAS_HEIGHT_PX = 256
const FONT_WEIGHT = 700

/** Pose calculée pour un mesh : de quoi projeter et cadrer la gravure. */
type EngravingPose = {
  mesh: Mesh
  /** Point de surface au centre du texte. */
  center: Vector3
  /** Sens de lecture (unitaire), de gauche à droite à la vue initiale. */
  axis: Vector3
  /** Direction (unitaire) de la pointe vers le manche. */
  toHandle: Vector3
  /** Direction de projection (unitaire), sortant de la surface. */
  normal: Vector3
  /** Hauteur des lettres et longueur maximale, en unités monde. */
  height: number
  maxLength: number
  /** Rayon local : sert de profondeur au projecteur. */
  radius: number
}

export type EngravingResult = {
  /** Boîte englobante des décalques, pour le cadrage caméra. */
  box: Box3
  /** Direction depuis laquelle la gravure se lit. */
  normal: Vector3
}

/**
 * Calcule la pose de la gravure sur un mesh allongé.
 * `viewDir` : direction (unitaire) du modèle vers la caméra de la vue initiale.
 */
function computePose(
  mesh: Mesh,
  config: EngravingPreviewConfig,
  viewDir: Vector3,
  cameraRight: Vector3
): EngravingPose | null {
  const position = mesh.geometry.attributes.position
  if (!position || position.count < 3) return null

  const points: Vector3[] = []
  for (let i = 0; i < position.count; i++) {
    points.push(
      new Vector3().fromBufferAttribute(position, i).applyMatrix4(mesh.matrixWorld)
    )
  }

  const mean = new Vector3()
  points.forEach((p) => mean.add(p))
  mean.divideScalar(points.length)

  // Axe principal : itération de puissance sur la matrice de covariance.
  const c = [0, 0, 0, 0, 0, 0] // xx xy xz yy yz zz
  for (const p of points) {
    const x = p.x - mean.x
    const y = p.y - mean.y
    const z = p.z - mean.z
    c[0] += x * x
    c[1] += x * y
    c[2] += x * z
    c[3] += y * y
    c[4] += y * z
    c[5] += z * z
  }
  const axis = new Vector3(1, 0.37, 0.13).normalize()
  for (let it = 0; it < 50; it++) {
    axis
      .set(
        c[0] * axis.x + c[1] * axis.y + c[2] * axis.z,
        c[1] * axis.x + c[3] * axis.y + c[4] * axis.z,
        c[2] * axis.x + c[4] * axis.y + c[5] * axis.z
      )
      .normalize()
  }

  // Abscisse le long de l'axe et distance à l'axe de chaque sommet.
  const offset = new Vector3()
  const samples = points.map((p) => {
    offset.subVectors(p, mean)
    const s = offset.dot(axis)
    const r = offset.addScaledVector(axis, -s).length()
    return { s, r }
  })
  let sMin = Infinity
  let sMax = -Infinity
  for (const { s } of samples) {
    sMin = Math.min(sMin, s)
    sMax = Math.max(sMax, s)
  }
  const length = sMax - sMin
  if (length <= 0) return null

  // Rayon aux deux extrémités (10 % de chaque bout) : le plus épais est le manche.
  const radiusNear = (from: number) => {
    let r = 0
    for (const sample of samples) {
      if (Math.abs(sample.s - from) <= length * 0.1) r = Math.max(r, sample.r)
    }
    return r
  }
  const rMinEnd = radiusNear(sMin)
  const rMaxEnd = radiusNear(sMax)
  // Oriente l'axe du manche vers la pointe.
  const handleAtMax = rMaxEnd >= rMinEnd
  const sHandle = handleAtMax ? sMax : sMin
  const toTip = handleAtMax ? -1 : 1
  const rHandle = Math.max(rMinEnd, rMaxEnd)
  const rTip = Math.min(rMinEnd, rMaxEnd)
  // Profil conique : rayon interpolé entre le manche et la pointe.
  const radiusAt = (distanceFromHandle: number) =>
    rHandle + (rTip - rHandle) * Math.min(1, distanceFromHandle / length)

  const margin = length * config.marginRatio
  const maxLength = length * config.maxLengthRatio
  const height = 2 * radiusAt(margin + maxLength) * config.heightRatio

  // Direction de projection : vers la caméra, rendue perpendiculaire à l'axe.
  const normal = viewDir.clone().addScaledVector(axis, -viewDir.dot(axis))
  if (normal.lengthSq() < 1e-6) return null
  normal.normalize()

  // Sens de lecture : de gauche à droite à l'écran, quel que soit le bout où se
  // trouve le manche.
  const readingAxis = axis.clone().multiplyScalar(toTip)
  if (readingAxis.dot(cameraRight) < 0) readingAxis.negate()

  const distanceFromHandle = margin + maxLength / 2
  const onAxis = mean
    .clone()
    .addScaledVector(axis, sHandle + toTip * distanceFromHandle)
  const radius = radiusAt(distanceFromHandle)

  // Point de surface exact par lancer de rayon ; repli sur le cône théorique.
  const raycaster = new Raycaster(
    onAxis.clone().addScaledVector(normal, rHandle * 4),
    normal.clone().negate()
  )
  const hit = raycaster.intersectObject(mesh, false)[0]
  const center = hit
    ? hit.point.clone()
    : onAxis.clone().addScaledVector(normal, radius)

  return {
    mesh,
    center,
    axis: readingAxis,
    toHandle: axis.clone().multiplyScalar(-toTip),
    normal,
    height,
    maxLength,
    radius,
  }
}

/** Clair sur un fond sombre, brûlé sur un fond clair. */
function engravingColor(layers: MeshLayers | undefined): string {
  let luminance = 0.15 // bois noir d'origine du GLB
  if (layers?.texturePath) {
    const tint = layers.tint ?? "#ffffff"
    luminance = (0.55 * parseInt(tint.slice(1, 3), 16)) / 255
  } else if (layers?.color) {
    const hex = layers.color
    const r = parseInt(hex.slice(1, 3), 16)
    const g = parseInt(hex.slice(3, 5), 16)
    const b = parseInt(hex.slice(5, 7), 16)
    luminance = (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255
  }
  return luminance < 0.4 ? "#efe2c2" : "#3b2413"
}

/** Famille de Satoshi telle que next/font l'a nommée (nom haché). */
function fontFamily(): string {
  const family = getComputedStyle(document.documentElement)
    .getPropertyValue("--font-satoshi")
    .trim()
  return family || "sans-serif"
}

/**
 * Dessine le texte sur un canvas au ratio de la zone gravée.
 * Retourne aussi la longueur monde retenue : le texte court garde la même
 * hauteur de lettres, le texte long est réduit pour tenir dans `maxLength`.
 */
function renderText(
  text: string,
  color: string,
  height: number,
  maxLength: number
): { canvas: HTMLCanvasElement; length: number } {
  const family = fontFamily()
  const fontPx = Math.round(CANVAS_HEIGHT_PX * 0.72)
  const font = `${FONT_WEIGHT} ${fontPx}px ${family}`
  const padding = CANVAS_HEIGHT_PX * 0.25

  const measure = document.createElement("canvas").getContext("2d")!
  measure.font = font
  const textWidth = measure.measureText(text).width + 2 * padding

  const pxPerUnit = CANVAS_HEIGHT_PX / height
  const length = Math.min(maxLength, textWidth / pxPerUnit)

  const canvas = document.createElement("canvas")
  canvas.width = Math.max(1, Math.min(4096, Math.round(length * pxPerUnit)))
  canvas.height = CANVAS_HEIGHT_PX
  const ctx = canvas.getContext("2d")!
  const fit = Math.min(1, canvas.width / textWidth)
  ctx.font = `${FONT_WEIGHT} ${Math.floor(fontPx * fit)}px ${family}`
  ctx.fillStyle = color
  ctx.textAlign = "center"
  ctx.textBaseline = "middle"
  ctx.fillText(text, canvas.width / 2, canvas.height / 2)

  return { canvas, length }
}

/** Retire et libère tous les décalques du groupe. */
export function clearEngraving(group: Group): void {
  for (const child of [...group.children]) {
    group.remove(child)
    if (child instanceof Mesh) {
      child.geometry.dispose()
      const material = child.material as MeshStandardMaterial
      material.map?.dispose()
      material.dispose()
    }
  }
}

/**
 * (Re)construit la gravure dans `group`. Texte vide = gravure retirée.
 *
 * `group` vit dans la SCÈNE et non sous le modèle : `findMeshes` parcourt le
 * modèle, et les décalques y seraient repeints par les options de couleur ou
 * cadrés par le zoom contextuel. Le modèle étant immobile (l'auto-rotation
 * déplace la caméra), des coordonnées monde restent justes.
 */
export async function buildEngraving(params: {
  group: Group
  root: Object3D
  config: EngravingPreviewConfig
  text: string
  /** Position de la caméra et cible de la vue initiale. */
  homePosition: Vector3
  homeTarget: Vector3
  /** Abandonne si une reconstruction plus récente a démarré. */
  isStale: () => boolean
}): Promise<EngravingResult | null> {
  const { group, root, config, homePosition, homeTarget, isStale } = params
  const text = params.text.trim()

  if (text) {
    // Sans cela, le premier dessin part avec la police de repli.
    await document.fonts
      .load(`${FONT_WEIGHT} 64px ${fontFamily()}`, text)
      .catch(() => undefined)
  }
  if (isStale()) return null

  clearEngraving(group)
  if (!text) return null

  root.updateWorldMatrix(true, true)
  const viewDir = new Vector3().subVectors(homePosition, homeTarget).normalize()
  // Droite de l'écran à la vue initiale (caméra sans roulis : up = +Y).
  const cameraRight = new Vector3(0, 1, 0).cross(viewDir).normalize()

  const box = new Box3()
  let normal: Vector3 | null = null

  for (const mesh of findMeshes(root, config.targetMesh)) {
    const pose = computePose(mesh, config, viewDir, cameraRight)
    if (!pose) continue

    const layers = (mesh.userData as { layers?: MeshLayers }).layers
    const { canvas, length } = renderText(
      text,
      engravingColor(layers),
      pose.height,
      pose.maxLength
    )

    // Le texte part du manche : plus court que le maximum, il est recentré de
    // la moitié de la place laissée libre, côté manche.
    const center = pose.center
      .clone()
      .addScaledVector(pose.toHandle, (pose.maxLength - length) / 2)

    // Repère du projecteur : x = sens de lecture, z = hors de la surface,
    // y = z × x (haut des lettres) — base directe, donc texte non inversé.
    const zAxis = pose.normal
    const xAxis = pose.axis
    const yAxis = new Vector3().crossVectors(zAxis, xAxis)
    const orientation = new Euler().setFromRotationMatrix(
      new Matrix4().makeBasis(xAxis, yAxis, zAxis)
    )

    const geometry = new DecalGeometry(
      mesh,
      center,
      orientation,
      // Profondeur ≈ rayon : couvre la face visible sans atteindre la face
      // opposée, où le texte apparaîtrait en miroir.
      new Vector3(length, pose.height, pose.radius)
    )

    const texture = new CanvasTexture(canvas)
    texture.colorSpace = SRGBColorSpace
    texture.anisotropy = 8

    const decal = new Mesh(
      geometry,
      new MeshStandardMaterial({
        map: texture,
        transparent: true,
        depthWrite: false,
        polygonOffset: true,
        polygonOffsetFactor: -4,
        roughness: 0.85,
        metalness: 0,
      })
    )
    decal.name = "configurator-engraving-decal"
    decal.renderOrder = 1
    group.add(decal)

    box.expandByPoint(center.clone().addScaledVector(xAxis, length / 2))
    box.expandByPoint(center.clone().addScaledVector(xAxis, -length / 2))
    normal ??= pose.normal
  }

  if (!normal || box.isEmpty()) return null
  return { box, normal }
}
