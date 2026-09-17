import {
  BackSide,
  Box3,
  BufferGeometry,
  Float32BufferAttribute,
  CanvasTexture,
  DoubleSide,
  Euler,
  FrontSide,
  Group,
  Matrix4,
  Mesh,
  MeshBasicMaterial,
  MeshStandardMaterial,
  Object3D,
  Raycaster,
  SRGBColorSpace,
  Vector3,
  type BufferAttribute,
  type Intersection,
  type InterleavedBufferAttribute,
  type Side,
} from "three"
import { DecalGeometry } from "three/examples/jsm/geometries/DecalGeometry.js"
import type {
  ElongatedPlacement,
  EngravingPreviewConfig,
  PlanarPlacement,
  RibPlacement,
} from "./engraving-preview"
import { findMeshes } from "./three-helpers"

/**
 * Aperçu 3D de la gravure — PROTOTYPE (baguettes, éventail).
 *
 * Pourquoi un décalque projeté et non un calque de plus sur la texture composée
 * (`compositeLayers`) : les UV du GLB des baguettes sont inexploitables pour du
 * texte. `TEXCOORD_0` est un atlas écrasé dans une bande de 17 % de hauteur,
 * `TEXCOORD_1` (celui des textures d'origine) est répété en mosaïque et n'est
 * pas aligné sur la longueur. Un texte dessiné dans l'une ou l'autre sortirait
 * morcelé. Le décalque projette le texte sur la géométrie elle-même, sans
 * dépendre des UV — et le même moteur sert au papier plissé de l'éventail.
 *
 * Le placement est calculé, pas saisi : l'analyse en composantes principales
 * des sommets donne la forme du mesh (axe d'une pièce allongée, plan d'une
 * surface), puis le texte est projeté sur la face tournée vers la caméra de la
 * vue initiale. Aucune coordonnée propre au modèle n'est donc codée en dur —
 * seuls des ratios (cf. `engraving-preview.ts`).
 */
export type { EngravingPreviewConfig }

/** Résolution verticale du canvas du texte (la largeur suit le ratio). */
const CANVAS_HEIGHT_PX = 256
const FONT_WEIGHT = 700

/** Pose calculée pour un mesh : de quoi projeter et cadrer la gravure. */
type EngravingPose = {
  mesh: Mesh
  /**
   * Géométrie recevant la projection et les rayons : le mesh entier, ou la
   * seule branche retenue d'une monture — projeter sur les ~30 000 triangles
   * de toute la monture coûtait l'essentiel du temps de reconstruction.
   * Sa matière n'est pas lue (elle peut être remplacée après coup) : c'est
   * celle de `mesh` qui compte.
   */
  surface: Mesh
  /** Point de surface au centre de la zone gravée. */
  center: Vector3
  /** Sens de lecture (unitaire), de gauche à droite à la vue initiale. */
  axis: Vector3
  /**
   * Vers où recentrer un texte plus court que le maximum (unitaire) : le
   * manche d'une baguette. Vecteur nul = texte centré.
   */
  toStart: Vector3
  /** Direction de projection (unitaire), sortant de la surface. */
  normal: Vector3
  /** Hauteur des lettres et longueur maximale, en unités monde. */
  height: number
  maxLength: number
  /** Profondeur du projecteur, le long de la normale. */
  depth: number
  /** Décalage du projecteur le long de la normale, depuis `center`. */
  projectorShift: number
  /** Recul, depuis `center`, des rayons qui lisent la surface. */
  rayDistance: number
  /** Face du décalque à rendre : suit l'orientation des triangles touchés. */
  side: Side
}

export type EngravingResult = {
  /** Boîte englobante des décalques, pour le cadrage caméra. */
  box: Box3
  /** Direction depuis laquelle la gravure se lit. */
  normal: Vector3
}

/** Repère de la vue initiale, commun à tous les placements. */
type ViewFrame = {
  /** Direction (unitaire) du modèle vers la caméra. */
  viewDir: Vector3
  /** Droite de l'écran (unitaire). */
  right: Vector3
  /** Haut de l'écran (unitaire). */
  up: Vector3
}

/** Sommets du mesh en coordonnées monde. */
function worldPoints(mesh: Mesh): Vector3[] {
  const position = mesh.geometry.attributes.position
  const points: Vector3[] = []
  if (!position) return points
  for (let i = 0; i < position.count; i++) {
    points.push(
      new Vector3().fromBufferAttribute(position, i).applyMatrix4(mesh.matrixWorld)
    )
  }
  return points
}

/**
 * Centre et axes principaux d'un nuage de points, du plus étendu au moins
 * étendu : itération de puissance sur la covariance, puis déflation pour le
 * second axe. Le troisième, produit vectoriel des deux premiers, est la
 * normale d'une surface à peu près plane.
 */
function principalAxes(points: Vector3[]): {
  mean: Vector3
  axes: [Vector3, Vector3, Vector3]
} {
  const mean = new Vector3()
  points.forEach((p) => mean.add(p))
  mean.divideScalar(points.length)

  // Covariance symétrique : [xx, xy, xz, yy, yz, zz].
  const c = [0, 0, 0, 0, 0, 0]
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
  const apply = (v: Vector3) =>
    new Vector3(
      c[0] * v.x + c[1] * v.y + c[2] * v.z,
      c[1] * v.x + c[3] * v.y + c[4] * v.z,
      c[2] * v.x + c[4] * v.y + c[5] * v.z
    )
  const dominant = (start: Vector3) => {
    const v = start.clone().normalize()
    for (let it = 0; it < 60; it++) v.copy(apply(v)).normalize()
    return v
  }

  const e1 = dominant(new Vector3(1, 0.37, 0.13))
  const l1 = apply(e1).dot(e1)
  // Déflation : on retire la contribution de e1 à la covariance.
  c[0] -= l1 * e1.x * e1.x
  c[1] -= l1 * e1.x * e1.y
  c[2] -= l1 * e1.x * e1.z
  c[3] -= l1 * e1.y * e1.y
  c[4] -= l1 * e1.y * e1.z
  c[5] -= l1 * e1.z * e1.z
  // Point de départ non colinéaire à e1.
  const seed = Math.abs(e1.x) < 0.9 ? new Vector3(1, 0, 0) : new Vector3(0, 1, 0)
  const e2 = dominant(seed.addScaledVector(e1, -seed.dot(e1)))
  const e3 = new Vector3().crossVectors(e1, e2).normalize()

  return { mean, axes: [e1, e2, e3] }
}

/** Étendue des projections de `points` sur `dir`, relativement à `origin`. */
function extent(points: Vector3[], origin: Vector3, dir: Vector3) {
  let min = Infinity
  let max = -Infinity
  const offset = new Vector3()
  for (const p of points) {
    const s = offset.subVectors(p, origin).dot(dir)
    min = Math.min(min, s)
    max = Math.max(max, s)
  }
  return { min, max }
}

/**
 * Face à rendre : celle que les triangles du mesh présentent vers la caméra.
 * Nécessaire pour une surface simple face (papier) : rendu des deux côtés, le
 * texte apparaîtrait en miroir au dos.
 */
function sideFacing(
  hit: Intersection | undefined,
  mesh: Mesh,
  normal: Vector3
): Side {
  if (!hit?.face) return FrontSide
  const faceNormal = hit.face.normal.clone().transformDirection(mesh.matrixWorld)
  return faceNormal.dot(normal) >= 0 ? FrontSide : BackSide
}

/**
 * Pièce allongée et conique : texte le long de l'axe principal, en partant du
 * bout épais (le manche).
 */
function elongatedPose(
  mesh: Mesh,
  config: ElongatedPlacement,
  view: ViewFrame
): EngravingPose | null {
  const points = worldPoints(mesh)
  if (points.length < 3) return null
  const {
    mean,
    axes: [axis],
  } = principalAxes(points)

  // Abscisse le long de l'axe et distance à l'axe de chaque sommet.
  const offset = new Vector3()
  const samples = points.map((p) => {
    offset.subVectors(p, mean)
    const s = offset.dot(axis)
    const r = offset.addScaledVector(axis, -s).length()
    return { s, r }
  })
  const { min: sMin, max: sMax } = extent(points, mean, axis)
  const length = sMax - sMin
  if (length <= 0) return null

  // Rayon aux deux extrémités (10 % de chaque bout).
  const radiusNear = (from: number) => {
    let r = 0
    for (const sample of samples) {
      if (Math.abs(sample.s - from) <= length * 0.1) r = Math.max(r, sample.r)
    }
    return r
  }
  const rMinEnd = radiusNear(sMin)
  const rMaxEnd = radiusNear(sMax)
  const rThickest = Math.max(rMinEnd, rMaxEnd)

  // Bout de départ du texte : le plus épais (manche d'une baguette) ou le plus
  // bas à l'écran (manche d'ombrelle). L'axe est ensuite orienté depuis ce bout.
  const startAtMax =
    config.startFrom === "bottom"
      ? axis.dot(view.up) < 0
      : rMaxEnd >= rMinEnd
  const sStart = startAtMax ? sMax : sMin
  const away = startAtMax ? -1 : 1
  const rStart = startAtMax ? rMaxEnd : rMinEnd
  const rEnd = startAtMax ? rMinEnd : rMaxEnd
  // Profil conique : rayon interpolé entre les deux bouts.
  const radiusAt = (distanceFromStart: number) =>
    rStart + (rEnd - rStart) * Math.min(1, distanceFromStart / length)

  const margin = length * config.marginRatio
  const maxLength = length * config.maxLengthRatio
  // Lettres réglées sur le point le plus fin de la zone gravée, quel que soit
  // le sens de la conicité.
  const height =
    2 *
    Math.min(radiusAt(margin), radiusAt(margin + maxLength)) *
    config.heightRatio

  // Direction de projection : vers la caméra, rendue perpendiculaire à l'axe.
  const normal = view.viewDir
    .clone()
    .addScaledVector(axis, -view.viewDir.dot(axis))
  if (normal.lengthSq() < 1e-6) return null
  normal.normalize()

  // Sens de lecture : de gauche à droite à l'écran ; une pièce quasi verticale
  // se lit de bas en haut, comme le dos d'un livre.
  const readingAxis = axis.clone()
  const horizontal = readingAxis.dot(view.right)
  if (Math.abs(horizontal) > 0.2 ? horizontal < 0 : readingAxis.dot(view.up) < 0) {
    readingAxis.negate()
  }

  const distanceFromStart = margin + maxLength / 2
  const onAxis = mean
    .clone()
    .addScaledVector(axis, sStart + away * distanceFromStart)
  const radius = radiusAt(distanceFromStart)

  // Point de surface exact par lancer de rayon ; repli sur le cône théorique.
  const hit = new Raycaster(
    onAxis.clone().addScaledVector(normal, rThickest * 4),
    normal.clone().negate()
  ).intersectObject(mesh, false)[0]
  const center = hit
    ? hit.point.clone()
    : onAxis.clone().addScaledVector(normal, radius)

  return {
    mesh,
    surface: mesh,
    center,
    axis: readingAxis,
    toStart: axis.clone().multiplyScalar(-away),
    normal,
    height,
    maxLength,
    // Profondeur ≈ rayon : couvre la face visible sans atteindre la face
    // opposée, où le texte apparaîtrait en miroir.
    depth: radius,
    projectorShift: 0,
    rayDistance: rThickest * 4,
    // Volume fermé : ses faces avant suffisent.
    side: FrontSide,
  }
}

/**
 * Surface à peu près plane (papier plissé) : texte horizontal à la vue
 * initiale, centré sur un point de la surface.
 */
function planarPose(
  mesh: Mesh,
  config: PlanarPlacement,
  view: ViewFrame
): EngravingPose | null {
  const points = worldPoints(mesh)
  if (points.length < 3) return null
  const {
    mean,
    axes: [e1, , plane],
  } = principalAxes(points)

  // Normale du plan, tournée vers la caméra.
  const normal = plane.clone()
  if (normal.dot(view.viewDir) < 0) normal.negate()

  // Sens de lecture : la droite de l'écran, ramenée dans le plan.
  const axis = view.right.clone().addScaledVector(normal, -view.right.dot(normal))
  if (axis.lengthSq() < 1e-6) axis.copy(e1)
  axis.normalize()
  // Haut des lettres = normale × axe ; on retourne l'axe s'il pointe vers le bas.
  const up = new Vector3().crossVectors(normal, axis)
  if (up.y < 0) {
    axis.negate()
    up.negate()
  }

  const width = extent(points, mean, axis)
  const tall = extent(points, mean, up)
  const thickness = extent(points, mean, normal)
  const thick = thickness.max - thickness.min

  const onPlane = mean
    .clone()
    .addScaledVector(
      axis,
      width.min + config.anchor[0] * (width.max - width.min)
    )
    .addScaledVector(up, tall.min + config.anchor[1] * (tall.max - tall.min))

  // Rayons lancés devant tout le relief (plis) pour toucher la face avant.
  const rayDistance = thick * 2 + (tall.max - tall.min) * 0.01
  const hit = new Raycaster(
    onPlane.clone().addScaledVector(normal, rayDistance),
    normal.clone().negate()
  ).intersectObject(mesh, false)[0]
  const center = hit
    ? hit.point.clone()
    : onPlane.clone().addScaledVector(normal, thickness.max)

  // Le projecteur englobe toute l'épaisseur des plis : centré à mi-relief et
  // non sur le point touché, qui est sur un pli avancé.
  const middle = (thickness.min + thickness.max) / 2
  const centerDepth = new Vector3().subVectors(center, mean).dot(normal)

  return {
    mesh,
    surface: mesh,
    center,
    axis,
    toStart: new Vector3(),
    normal,
    height: (tall.max - tall.min) * config.heightRatio,
    maxLength: (width.max - width.min) * config.maxLengthRatio,
    depth: thick * 1.2 + (tall.max - tall.min) * 0.01,
    projectorShift: middle - centerDepth,
    rayDistance,
    side: sideFacing(hit, mesh, normal),
  }
}

/**
 * Îles de géométrie d'un mesh (sommets reliés par des triangles), en indices
 * de sommets. Les sommets confondus sont soudés au préalable : un export sépare
 * les sommets le long des coutures d'UV, ce qui couperait une branche en
 * morceaux. Mis en cache : la géométrie ne change pas, et l'analyse (~90 000
 * sommets pour la monture de l'éventail) serait sinon refaite à chaque frappe.
 */
const islandsCache = new WeakMap<BufferGeometry, number[][]>()

function geometryIslands(geometry: BufferGeometry): number[][] {
  const cached = islandsCache.get(geometry)
  if (cached) return cached

  const position = geometry.attributes.position
  geometry.computeBoundingBox()
  const size = geometry.boundingBox!.getSize(new Vector3()).length() || 1
  const tolerance = size * 1e-5

  // Soudure : un représentant par position arrondie.
  const representative = new Map<string, number>()
  const weld = new Int32Array(position.count)
  for (let i = 0; i < position.count; i++) {
    const key = `${Math.round(position.getX(i) / tolerance)},${Math.round(
      position.getY(i) / tolerance
    )},${Math.round(position.getZ(i) / tolerance)}`
    const existing = representative.get(key)
    weld[i] = existing ?? i
    if (existing === undefined) representative.set(key, i)
  }

  // Union-find sur les triangles.
  const parent = new Int32Array(position.count).map((_, i) => i)
  const find = (x: number) => {
    while (parent[x] !== x) {
      parent[x] = parent[parent[x]]
      x = parent[x]
    }
    return x
  }
  const union = (a: number, b: number) => {
    const ra = find(weld[a])
    const rb = find(weld[b])
    if (ra !== rb) parent[ra] = rb
  }
  const index = geometry.index
  const triangleCount = (index ? index.count : position.count) / 3
  for (let t = 0; t < triangleCount; t++) {
    const a = index ? index.getX(t * 3) : t * 3
    const b = index ? index.getX(t * 3 + 1) : t * 3 + 1
    const c = index ? index.getX(t * 3 + 2) : t * 3 + 2
    union(a, b)
    union(a, c)
  }

  const groups = new Map<number, number[]>()
  for (let i = 0; i < position.count; i++) {
    const root = find(weld[i])
    const group = groups.get(root)
    if (group) group.push(i)
    else groups.set(root, [i])
  }
  const islands = [...groups.values()]
  islandsCache.set(geometry, islands)
  return islands
}

/**
 * Mesh réduit à une île de géométrie, placé exactement comme `mesh` (même
 * matrice monde, hors scène). Seuls les triangles dont les trois sommets
 * appartiennent à l'île sont repris ; les attributs utiles à la projection et
 * à la lecture des UV sont copiés.
 */
function islandMesh(mesh: Mesh, island: number[]): Mesh {
  const source = mesh.geometry
  const inIsland = new Set(island)
  const index = source.index
  const triangleCount = (index ? index.count : source.attributes.position.count) / 3
  const vertices: number[] = []
  for (let t = 0; t < triangleCount; t++) {
    const corners = [0, 1, 2].map((k) => (index ? index.getX(t * 3 + k) : t * 3 + k))
    if (corners.every((v) => inIsland.has(v))) vertices.push(...corners)
  }

  const geometry = new BufferGeometry()
  for (const name of ["position", "normal", "uv", "uv1"]) {
    const attribute = source.attributes[name]
    if (!attribute) continue
    const size = attribute.itemSize
    const out = new Float32Array(vertices.length * size)
    vertices.forEach((v, i) => {
      for (let k = 0; k < size; k++) out[i * size + k] = attribute.getComponent(v, k)
    })
    geometry.setAttribute(name, new Float32BufferAttribute(out, size))
  }

  // Le lancer de rayons tient compte de la face rendue : les deux, comme le
  // mesh d'origine (matières du GLB en double face).
  const surface = new Mesh(geometry, new MeshBasicMaterial({ side: DoubleSide }))
  surface.matrixAutoUpdate = false
  surface.matrix.copy(mesh.matrixWorld)
  surface.matrixWorld.copy(mesh.matrixWorld)
  return surface
}

/**
 * Branche d'une monture en éventail : texte le long de la branche dont l'angle
 * à l'écran est le plus proche de `angleDeg`, en partant du pivot.
 */
function ribPose(
  mesh: Mesh,
  config: RibPlacement,
  view: ViewFrame
): EngravingPose | null {
  const all = worldPoints(mesh)
  if (all.length < 3) return null

  // Plan de la monture, normale tournée vers la caméra ; repère écran dans ce plan.
  const {
    axes: [, , plane],
  } = principalAxes(all)
  const normal = plane.clone()
  if (normal.dot(view.viewDir) < 0) normal.negate()
  const right = view.right
    .clone()
    .addScaledVector(normal, -view.right.dot(normal))
    .normalize()
  const up = new Vector3().crossVectors(normal, right)

  const ribs = geometryIslands(mesh.geometry)
    .filter((island) => island.length >= 3)
    .map((island) => {
      const points = island.map((i) => all[i])
      const { mean, axes } = principalAxes(points)
      return { island, points, mean, axis: axes[0] }
    })
  if (ribs.length === 0) return null

  // Le pivot est du côté où les branches convergent : vers le barycentre de
  // leurs centres. Chaque axe est orienté du pivot vers le bout.
  const hub = new Vector3()
  ribs.forEach((rib) => hub.add(rib.mean))
  hub.divideScalar(ribs.length)
  for (const rib of ribs) {
    const { min, max } = extent(rib.points, rib.mean, rib.axis)
    const towardHub = new Vector3().subVectors(hub, rib.mean).dot(rib.axis)
    // Le bout le plus éloigné du pivot est le « bout » de la branche.
    if (Math.abs(max - towardHub) < Math.abs(min - towardHub)) rib.axis.negate()
  }

  const target = (config.angleDeg * Math.PI) / 180
  const screenAngle = (axis: Vector3) => Math.atan2(axis.dot(up), axis.dot(right))
  const angleGap = (axis: Vector3) => {
    const d = Math.abs(screenAngle(axis) - target) % (2 * Math.PI)
    return Math.min(d, 2 * Math.PI - d)
  }
  const rib = ribs.reduce((best, r) =>
    angleGap(r.axis) < angleGap(best.axis) ? r : best
  )

  const { axis, points, mean } = rib
  const surface = islandMesh(mesh, rib.island)
  const along = extent(points, mean, axis)
  const length = along.max - along.min
  if (length <= 0) return null
  const maxLength = length * config.maxLengthRatio
  const sCenter =
    along.min + length * config.startRatio + maxLength / 2

  // Largeur de la branche sur la zone gravée : la plus étroite de quelques
  // tranches, pour que le texte ne déborde nulle part sur le vide.
  const across = new Vector3().crossVectors(normal, axis)
  const offset = new Vector3()
  const sliceHalf = length * 0.02
  let width = Infinity
  for (let k = 0; k <= 4; k++) {
    const s = sCenter - maxLength / 2 + (k / 4) * maxLength
    let lo = Infinity
    let hi = -Infinity
    for (const p of points) {
      offset.subVectors(p, mean)
      if (Math.abs(offset.dot(axis) - s) > sliceHalf) continue
      const w = offset.dot(across)
      lo = Math.min(lo, w)
      hi = Math.max(hi, w)
    }
    if (hi > lo) width = Math.min(width, hi - lo)
  }
  if (!Number.isFinite(width)) return null
  const thickness = extent(points, mean, normal)
  const thick = thickness.max - thickness.min

  // Centre de la branche sur la tranche du milieu, puis point de surface.
  let middleLo = Infinity
  let middleHi = -Infinity
  for (const p of points) {
    offset.subVectors(p, mean)
    if (Math.abs(offset.dot(axis) - sCenter) > sliceHalf) continue
    const w = offset.dot(across)
    middleLo = Math.min(middleLo, w)
    middleHi = Math.max(middleHi, w)
  }
  const onAxis = mean
    .clone()
    .addScaledVector(axis, sCenter)
    .addScaledVector(across, (middleLo + middleHi) / 2)
  const rayDistance = thick * 4 + length * 0.01
  const hit = new Raycaster(
    onAxis.clone().addScaledVector(normal, rayDistance),
    normal.clone().negate()
  ).intersectObject(surface, false)[0]
  const center = hit
    ? hit.point.clone()
    : onAxis.clone().addScaledVector(normal, thickness.max)

  // Lecture de gauche à droite ; une branche quasi verticale se lit de bas en
  // haut, comme le dos d'un livre.
  const reading = axis.clone()
  const horizontal = reading.dot(right)
  if (Math.abs(horizontal) > 0.2 ? horizontal < 0 : reading.dot(up) < 0) {
    reading.negate()
  }

  return {
    mesh,
    surface,
    center,
    axis: reading,
    toStart: axis.clone().negate(),
    normal,
    height: width * config.heightRatio,
    maxLength,
    // Moins que l'épaisseur : la face avant seulement, pas les branches
    // empilées derrière.
    depth: thick * 0.8,
    projectorShift: 0,
    rayDistance,
    side: sideFacing(hit, mesh, normal),
  }
}

/**
 * Ne garde que les triangles du décalque tournés du même côté que la face
 * visée (`side`, vue depuis `normal`).
 *
 * Le projecteur de l'éventail doit englober toute la profondeur des plis, et
 * attrape donc aussi la couche arrière du papier : sans ce tri, le texte se
 * lisait en miroir au dos. Les plis, inclinés de moins de 90°, gardent le même
 * sens que la face avant.
 */
function keepFacingTriangles(
  geometry: BufferGeometry,
  normal: Vector3,
  side: Side
): BufferGeometry {
  const position = geometry.attributes.position
  const uv = geometry.attributes.uv
  const normals = geometry.attributes.normal
  const expected = side === BackSide ? -1 : 1
  const keep: number[] = []
  const a = new Vector3()
  const b = new Vector3()
  const c = new Vector3()
  for (let i = 0; i + 2 < position.count; i += 3) {
    a.fromBufferAttribute(position, i)
    b.fromBufferAttribute(position, i + 1)
    c.fromBufferAttribute(position, i + 2)
    const faceNormal = b.sub(a).cross(c.sub(a))
    if (Math.sign(faceNormal.dot(normal)) === expected) keep.push(i)
  }
  if (keep.length * 3 === position.count) return geometry

  const pick = (attribute: BufferAttribute | InterleavedBufferAttribute) => {
    const size = attribute.itemSize
    const out = new Float32Array(keep.length * 3 * size)
    keep.forEach((start, t) => {
      for (let v = 0; v < 3; v++) {
        for (let k = 0; k < size; k++) {
          out[(t * 3 + v) * size + k] = attribute.getComponent(start + v, k)
        }
      }
    })
    return new Float32BufferAttribute(out, size)
  }
  const filtered = new BufferGeometry()
  filtered.setAttribute("position", pick(position))
  if (uv) filtered.setAttribute("uv", pick(uv))
  if (normals) filtered.setAttribute("normal", pick(normals))
  geometry.dispose()
  return filtered
}

/**
 * Poses déjà calculées. La pose ne dépend que de la géométrie (fixe), des
 * réglages et de la vue initiale — pas du texte ni des matières : sans cache,
 * la monture de l'éventail coûtait ~160 ms d'analyse à chaque pause de frappe.
 */
const poseCache = new WeakMap<
  Mesh,
  { config: EngravingPreviewConfig; viewDir: Vector3; pose: EngravingPose | null }
>()

function computePose(
  mesh: Mesh,
  config: EngravingPreviewConfig,
  view: ViewFrame
): EngravingPose | null {
  const cached = poseCache.get(mesh)
  if (cached?.config === config && cached.viewDir.equals(view.viewDir)) {
    return cached.pose
  }
  let pose: EngravingPose | null
  switch (config.placement) {
    case "planar":
      pose = planarPose(mesh, config, view)
      break
    case "rib":
      pose = ribPose(mesh, config, view)
      break
    default:
      pose = elongatedPose(mesh, config, view)
  }
  poseCache.set(mesh, { config, viewDir: view.viewDir.clone(), pose })
  return pose
}

/**
 * Teintes de la gravure, toujours translucides : le veinage ou le motif reste
 * visible au travers, comme sur une pièce réellement marquée au laser.
 * Sombre sur un fond clair, claire (inverse) sur un fond sombre.
 */
const DARK_ENGRAVING_COLOR = "rgba(0, 0, 0, 0.72)"
const LIGHT_ENGRAVING_COLOR = "rgba(255, 246, 228, 0.82)"
/** En deçà, le fond est jugé sombre (luminance relative, 0 = noir). */
const DARK_BACKGROUND_LUMINANCE = 0.4

/** Rayons d'échantillonnage le long et en travers de la zone gravée. */
const SAMPLES_ALONG = 7
const SAMPLES_ACROSS = 3
/** Résolution à laquelle une texture est réduite pour être lue. */
const SAMPLE_TEXTURE_PX = 256

/** Pixels réduits de chaque image déjà lue (canvas composé, image, bitmap). */
const pixelCache = new WeakMap<object, ImageData | null>()

function readPixels(image: CanvasImageSource): ImageData | null {
  const key = image as object
  if (pixelCache.has(key)) return pixelCache.get(key) ?? null
  let pixels: ImageData | null = null
  try {
    const canvas = document.createElement("canvas")
    canvas.width = SAMPLE_TEXTURE_PX
    canvas.height = SAMPLE_TEXTURE_PX
    const ctx = canvas.getContext("2d", { willReadFrequently: true })!
    ctx.drawImage(image, 0, 0, SAMPLE_TEXTURE_PX, SAMPLE_TEXTURE_PX)
    pixels = ctx.getImageData(0, 0, SAMPLE_TEXTURE_PX, SAMPLE_TEXTURE_PX)
  } catch {
    // Image sans CORS (canvas « tainted ») ou pas encore décodée.
  }
  pixelCache.set(key, pixels)
  return pixels
}

const luminanceOf = (r: number, g: number, b: number) =>
  (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255

/**
 * Luminance moyenne de la surface SOUS le texte, telle qu'elle est rendue :
 * texture du matériau (bois, motif composé…) multipliée par sa teinte.
 *
 * On lit les pixels réels plutôt que de déduire la teinte des options
 * choisies : un motif peut être clair ou sombre, et seul son rendu le dit.
 * Chaque rayon renvoie les UV du point touché, dans le jeu de coordonnées que
 * la texture utilise (`map.channel` : 0 pour les textures du configurateur,
 * 1 pour celles d'origine du GLB des baguettes).
 */
function sampleLuminance(
  /** Porteur de la matière lue. */
  mesh: Mesh,
  /** Géométrie visée par les rayons (cf. `EngravingPose.surface`). */
  surface: Mesh,
  center: Vector3,
  axis: Vector3,
  normal: Vector3,
  length: number,
  height: number,
  /** Recul des rayons devant la surface. */
  rayDistance: number
): number {
  const material = mesh.material as MeshStandardMaterial
  const tint = material.color.clone().convertLinearToSRGB()
  const map = material.map
  const pixels = map?.image ? readPixels(map.image as CanvasImageSource) : null
  if (!map || !pixels) {
    return luminanceOf(tint.r * 255, tint.g * 255, tint.b * 255)
  }

  const across = new Vector3().crossVectors(normal, axis)
  const raycaster = new Raycaster()
  const direction = normal.clone().negate()
  const origin = new Vector3()
  let total = 0
  let count = 0

  for (let i = 0; i < SAMPLES_ALONG; i++) {
    for (let j = 0; j < SAMPLES_ACROSS; j++) {
      const t = (i + 0.5) / SAMPLES_ALONG - 0.5
      const s = (j + 0.5) / SAMPLES_ACROSS - 0.5
      origin
        .copy(center)
        .addScaledVector(axis, t * length)
        .addScaledVector(across, s * height)
        .addScaledVector(normal, rayDistance)
      raycaster.set(origin, direction)
      const hit = raycaster.intersectObject(surface, false)[0]
      const uv = map.channel === 1 ? hit?.uv1 : hit?.uv
      if (!uv) continue

      // Coordonnées répétées (TEXCOORD_1 déborde de [0, 1]) : partie décimale.
      const u = uv.x - Math.floor(uv.x)
      const v = uv.y - Math.floor(uv.y)
      const x = Math.min(pixels.width - 1, Math.floor(u * pixels.width))
      const y = Math.min(
        pixels.height - 1,
        Math.floor((map.flipY ? 1 - v : v) * pixels.height)
      )
      const k = (y * pixels.width + x) * 4
      total += luminanceOf(
        pixels.data[k] * tint.r,
        pixels.data[k + 1] * tint.g,
        pixels.data[k + 2] * tint.b
      )
      count++
    }
  }

  return count > 0
    ? total / count
    : luminanceOf(tint.r * 255, tint.g * 255, tint.b * 255)
}

function engravingColor(backgroundLuminance: number): string {
  return backgroundLuminance < DARK_BACKGROUND_LUMINANCE
    ? LIGHT_ENGRAVING_COLOR
    : DARK_ENGRAVING_COLOR
}

/** Famille de Satoshi telle que next/font l'a nommée (nom haché). */
function fontFamily(): string {
  const family = getComputedStyle(document.documentElement)
    .getPropertyValue("--font-satoshi")
    .trim()
  return family || "sans-serif"
}

/**
 * Mesure le texte et retourne la longueur monde retenue — le texte court garde
 * la même hauteur de lettres, le texte long est réduit pour tenir dans
 * `maxLength` — ainsi que de quoi le dessiner sur un canvas au ratio de la zone.
 *
 * Mesure et dessin sont séparés : la couleur dépend du fond sous le texte, que
 * l'on ne peut lire qu'une fois sa longueur (donc son emprise) connue.
 */
function layoutText(
  text: string,
  height: number,
  maxLength: number
): { length: number; draw: (color: string) => HTMLCanvasElement } {
  const family = fontFamily()
  const fontPx = Math.round(CANVAS_HEIGHT_PX * 0.72)
  const font = `${FONT_WEIGHT} ${fontPx}px ${family}`
  const padding = CANVAS_HEIGHT_PX * 0.25

  const measure = document.createElement("canvas").getContext("2d")!
  measure.font = font
  const textWidth = measure.measureText(text).width + 2 * padding

  const pxPerUnit = CANVAS_HEIGHT_PX / height
  const length = Math.min(maxLength, textWidth / pxPerUnit)

  const draw = (color: string) => {
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
    return canvas
  }

  return { length, draw }
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
  // Repère écran à la vue initiale (caméra sans roulis : haut du monde = +Y).
  const right = new Vector3(0, 1, 0).cross(viewDir).normalize()
  const view: ViewFrame = {
    viewDir,
    right,
    up: new Vector3().crossVectors(viewDir, right),
  }

  const box = new Box3()
  let normal: Vector3 | null = null

  for (const mesh of findMeshes(root, config.targetMesh)) {
    const pose = computePose(mesh, config, view)
    if (!pose) continue

    const { length, draw } = layoutText(text, pose.height, pose.maxLength)

    // Texte plus court que le maximum : recentré de la moitié de la place
    // laissée libre, vers son point de départ (le manche d'une baguette).
    const center = pose.center
      .clone()
      .addScaledVector(pose.toStart, (pose.maxLength - length) / 2)

    const canvas = draw(
      engravingColor(
        sampleLuminance(
          mesh,
          pose.surface,
          center,
          pose.axis,
          pose.normal,
          length,
          pose.height,
          pose.rayDistance
        )
      )
    )

    // Repère du projecteur : x = sens de lecture, z = hors de la surface,
    // y = z × x (haut des lettres) — base directe, donc texte non inversé.
    const zAxis = pose.normal
    const xAxis = pose.axis
    const yAxis = new Vector3().crossVectors(zAxis, xAxis)
    const orientation = new Euler().setFromRotationMatrix(
      new Matrix4().makeBasis(xAxis, yAxis, zAxis)
    )

    const geometry = keepFacingTriangles(
      new DecalGeometry(
        pose.surface,
        center.clone().addScaledVector(pose.normal, pose.projectorShift),
        orientation,
        new Vector3(length, pose.height, pose.depth)
      ),
      pose.normal,
      pose.side
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
        side: pose.side,
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
