import {
  ACESFilmicToneMapping,
  AmbientLight,
  Box3,
  Color,
  DirectionalLight,
  Group,
  HemisphereLight,
  Mesh,
  MeshStandardMaterial,
  Object3D,
  PerspectiveCamera,
  Scene,
  SRGBColorSpace,
  Texture,
  TextureLoader,
  Vector3,
  WebGLRenderer,
} from "three"
import { GLTFLoader, GLTF } from "three/examples/jsm/loaders/GLTFLoader.js"
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js"

export type ThreeContext = {
  scene: Scene
  camera: PerspectiveCamera
  renderer: WebGLRenderer
  canvas: HTMLCanvasElement
  controls: OrbitControls
}

const DEFAULT_BG = new Color(0xf5f3ef)

/**
 * Initialise une scène Three.js dans le canvas fourni.
 * Le caller est responsable d'appeler `dispose()` au démontage.
 */
export function initThreeScene(canvas: HTMLCanvasElement): ThreeContext {
  const renderer = new WebGLRenderer({
    canvas,
    antialias: true,
    alpha: true,
  })
  const { width, height } = canvas.getBoundingClientRect()
  const w = Math.max(1, width)
  const h = Math.max(1, height)
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
  renderer.setSize(w, h, false)
  renderer.outputColorSpace = SRGBColorSpace
  renderer.toneMapping = ACESFilmicToneMapping
  renderer.toneMappingExposure = 1.05

  const scene = new Scene()
  scene.background = DEFAULT_BG

  const camera = new PerspectiveCamera(40, w / h, 0.1, 100)
  camera.position.set(0, 1, 4)
  camera.lookAt(0, 0, 0)

  const controls = new OrbitControls(camera, canvas)
  controls.enableDamping = true
  controls.dampingFactor = 0.08
  controls.enablePan = false
  controls.autoRotate = true
  controls.autoRotateSpeed = 1.0
  controls.minPolarAngle = Math.PI / 6   // can't tilt completely top-down
  controls.maxPolarAngle = Math.PI / 1.6 // can't go fully under the model

  setupStudioLighting(scene)

  return { scene, camera, renderer, canvas, controls }
}

/**
 * Studio 3-point lighting + soft hemisphere fill.
 * Pensé pour mettre en valeur des produits sur fond clair sans casser les couleurs.
 */
function setupStudioLighting(scene: Scene): void {
  // Soft sky / ground fill
  const hemi = new HemisphereLight(0xffffff, 0xc4b8a8, 0.55)
  hemi.position.set(0, 10, 0)
  scene.add(hemi)

  // Discreet global ambient to lift shadows
  const ambient = new AmbientLight(0xffffff, 0.25)
  scene.add(ambient)

  // Key light (front-top-right)
  const key = new DirectionalLight(0xffffff, 2.4)
  key.position.set(5, 8, 6)
  scene.add(key)

  // Fill light (front-left, dimmer, slightly cooler)
  const fill = new DirectionalLight(0xe6efff, 0.9)
  fill.position.set(-6, 4, 3)
  scene.add(fill)

  // Rim / back light (highlight silhouette)
  const rim = new DirectionalLight(0xfff4e0, 1.2)
  rim.position.set(-2, 6, -7)
  scene.add(rim)
}

export function resizeRendererToCanvas(ctx: ThreeContext): void {
  const { width, height } = ctx.canvas.getBoundingClientRect()
  const w = Math.max(1, Math.floor(width))
  const h = Math.max(1, Math.floor(height))
  const needsResize =
    ctx.renderer.domElement.width !== w || ctx.renderer.domElement.height !== h
  if (!needsResize) return
  ctx.renderer.setSize(w, h, false)
  ctx.camera.aspect = w / h
  ctx.camera.updateProjectionMatrix()
}

/**
 * Charge un GLB et retourne le root Object3D, centré et mis à l'échelle.
 * La caméra est repositionnée pour cadrer le modèle entier.
 *
 * Si gltf.scene est vide, on essaie en fallback :
 *  - gltf.scenes[i] qui contient au moins un mesh
 *  - sinon on attache tous les meshes trouvés via parser dans un Group
 */
export function loadGLB(
  path: string,
  ctx?: Pick<ThreeContext, "camera" | "controls">,
  rotationDeg?: [number, number, number]
): Promise<Object3D> {
  const loader = new GLTFLoader()
  return new Promise((resolve, reject) => {
    loader.load(
      path,
      (gltf) => {
        const inner = pickRoot(gltf)
        if (countMeshes(inner) === 0) {
          reject(new Error("GLB chargé mais aucun mesh trouvé"))
          return
        }
        const pivot = new Group()
        pivot.name = "configurator-pivot"
        pivot.add(inner)
        fitToView(pivot, inner, 2, ctx, rotationDeg)
        resolve(pivot)
      },
      undefined,
      (err: unknown) => {
        // eslint-disable-next-line no-console
        console.error("[configurator] GLB load failed", path, err)
        reject(err)
      }
    )
  })
}

function countMeshes(root: Object3D): number {
  let count = 0
  root.traverse((child) => {
    if (child instanceof Mesh) count++
  })
  return count
}

function pickRoot(gltf: GLTF): Object3D {
  if (countMeshes(gltf.scene) > 0) return gltf.scene
  if (Array.isArray(gltf.scenes)) {
    for (const scene of gltf.scenes) {
      if (countMeshes(scene) > 0) {
        // eslint-disable-next-line no-console
        console.warn(
          "[configurator] gltf.scene was empty, falling back to gltf.scenes[i]"
        )
        return scene
      }
    }
  }
  // last-ditch: collect anything that's a mesh in the parser cache
  const collected = new Group()
  collected.name = "configurator-fallback-root"
  const all: Object3D[] = []
  gltf.scenes?.forEach((s) => all.push(s))
  if (gltf.scene) all.push(gltf.scene)
  for (const obj of all) {
    obj.traverse((child) => {
      if (child instanceof Mesh) collected.add(child.clone())
    })
  }
  if (collected.children.length > 0) {
    // eslint-disable-next-line no-console
    console.warn(
      "[configurator] no scene contained meshes; rebuilt root from traversal"
    )
  }
  return collected
}

function fitToView(
  pivot: Object3D,
  inner: Object3D,
  targetSize: number,
  ctx?: Pick<ThreeContext, "camera" | "controls">,
  // Orientation du modèle en degrés [x, y, z]. Par défaut [0, 0, 90] pour
  // conserver l'orientation historique des autres produits.
  rotationDeg: [number, number, number] = [0, 0, 90]
): void {
  const box = new Box3().setFromObject(inner)
  const size = new Vector3()
  const center = new Vector3()
  box.getSize(size)
  box.getCenter(center)
  inner.position.sub(center)
  const maxDim = Math.max(size.x, size.y, size.z) || 1
  const scale = targetSize / maxDim
  pivot.scale.setScalar(scale)
  const deg2rad = Math.PI / 180
  pivot.rotation.set(
    rotationDeg[0] * deg2rad,
    rotationDeg[1] * deg2rad,
    rotationDeg[2] * deg2rad
  )

  if (!ctx) return
  const { camera, controls } = ctx

  // Rayon de la sphère englobante après mise à l'échelle : garantit que le
  // modèle tient entièrement quelle que soit l'orientation (auto-rotation),
  // sans rognage de ses extrémités.
  const radius = 0.5 * size.length() * scale || targetSize / 2

  // Cadrage qui tient compte du ratio du canvas. Sur un écran étroit/portrait
  // (mobile) c'est le FOV horizontal qui limite ; sinon le vertical. On retient
  // la distance la plus contraignante, puis une petite marge pour « rapprocher »
  // le produit au lieu de le laisser flotter au loin.
  const vFov = (camera.fov * Math.PI) / 180
  const aspect = camera.aspect || 1
  const hFov = 2 * Math.atan(Math.tan(vFov / 2) * aspect)
  const fitVertical = radius / Math.sin(vFov / 2)
  const fitHorizontal = radius / Math.sin(hFov / 2)
  const margin = 1.08
  const distance = Math.max(fitVertical, fitHorizontal) * margin

  camera.position.set(0, radius * 0.35, distance)
  camera.near = Math.max(distance / 100, 0.01)
  camera.far = distance * 100
  camera.lookAt(0, 0, 0)
  camera.updateProjectionMatrix()

  controls.target.set(0, 0, 0)
  controls.minDistance = radius * 1.1
  controls.maxDistance = distance * 2.5
  controls.update()
}

function getMaterialName(mesh: Mesh): string | undefined {
  const mat = mesh.material
  return Array.isArray(mat)
    ? mat[0]?.name
    : (mat as { name?: string } | undefined)?.name
}

/**
 * Retourne tous les meshes de la hiérarchie dont le nom OU le nom de matériau
 * matche `meshName`. `meshName` peut être un nom unique ou une liste de noms
 * (ex. les 2 vis ciblées par une même option). Si rien ne matche, log un
 * avertissement et retourne tous les meshes (fallback : applique sur tout le modèle).
 */
export function findMeshes(
  root: Object3D,
  meshName?: string | string[]
): Mesh[] {
  const all: Mesh[] = []
  root.traverse((child) => {
    if (child instanceof Mesh) all.push(child)
  })
  if (!meshName) return all
  const names = Array.isArray(meshName) ? meshName : [meshName]
  const matched = all.filter(
    (m) => names.includes(m.name) || names.includes(getMaterialName(m) ?? "")
  )
  if (matched.length > 0) return matched

  // eslint-disable-next-line no-console
  console.warn(
    `[configurator] targetMesh "${names.join(", ")}" introuvable. ` +
      `Fallback sur tous les meshes. Noms disponibles :`,
    all.map((m) => ({ mesh: m.name, material: getMaterialName(m) }))
  )
  return all
}

const textureCache = new Map<string, Promise<Texture>>()

export function loadTexture(path: string): Promise<Texture> {
  const cached = textureCache.get(path)
  if (cached) return cached
  const loader = new TextureLoader()
  const promise = new Promise<Texture>((resolve, reject) => {
    loader.load(
      path,
      (texture) => {
        texture.colorSpace = SRGBColorSpace
        texture.flipY = false
        resolve(texture)
      },
      undefined,
      (err: unknown) => reject(err)
    )
  })
  textureCache.set(path, promise)
  return promise
}

/**
 * Charge une image brute (pour la composition canvas du motif). Cache partagé.
 */
const imageCache = new Map<string, Promise<HTMLImageElement>>()

function loadImage(path: string): Promise<HTMLImageElement> {
  const cached = imageCache.get(path)
  if (cached) return cached
  const promise = new Promise<HTMLImageElement>((resolve, reject) => {
    const img = new Image()
    img.crossOrigin = "anonymous"
    img.onload = () => resolve(img)
    img.onerror = (e) => reject(e)
    img.src = path
  })
  imageCache.set(path, promise)
  return promise
}

/**
 * Calques d'un mesh. `color` et `texturePath` sont deux bases mutuellement
 * exclusives (couleur unie OU texture). `motifPath` est un overlay transparent
 * composé par-dessus la base — il coexiste avec elle.
 */
export type MeshLayers = {
  color?: string | null
  texturePath?: string | null
  motifPath?: string | null
}

type MeshUserData = { layers?: MeshLayers }

function ensureStandardMaterial(mesh: Mesh): MeshStandardMaterial {
  if (mesh.material instanceof MeshStandardMaterial) return mesh.material
  const mat = new MeshStandardMaterial()
  mesh.material = mat
  return mat
}

/**
 * Compose la base (texture de soie/bois OU couleur unie) puis dessine le motif
 * transparent par-dessus, sur un canvas, et retourne la texture résultante.
 */
async function compositeLayers(layers: MeshLayers): Promise<Texture> {
  const motif = await loadImage(layers.motifPath as string)
  let baseImg: HTMLImageElement | null = null
  if (layers.texturePath) {
    baseImg = await loadImage(layers.texturePath).catch(() => null)
  }
  const w = baseImg?.naturalWidth || motif.naturalWidth || 1024
  const h = baseImg?.naturalHeight || motif.naturalHeight || 1024
  const canvas = document.createElement("canvas")
  canvas.width = w
  canvas.height = h
  const ctx = canvas.getContext("2d")!
  // Base : image de tissu, sinon couleur unie, sinon blanc.
  if (baseImg) {
    ctx.drawImage(baseImg, 0, 0, w, h)
  } else {
    ctx.fillStyle = layers.color || "#ffffff"
    ctx.fillRect(0, 0, w, h)
  }
  // Overlay motif (PNG transparent) étiré sur toute la surface.
  ctx.drawImage(motif, 0, 0, w, h)
  const texture = new Texture(canvas)
  texture.colorSpace = SRGBColorSpace
  texture.flipY = false
  texture.needsUpdate = true
  return texture
}

/**
 * Reconstruit le matériau d'un mesh à partir de ses calques courants.
 */
async function rebuildMeshMaterial(
  mesh: Mesh,
  layers: MeshLayers
): Promise<void> {
  const mat = ensureStandardMaterial(mesh)
  if (layers.motifPath) {
    // Base (couleur ou tissu) + motif composés en une seule texture.
    const tex = await compositeLayers(layers).catch(() => null)
    if (tex) {
      mat.map = tex
      mat.color.set("#ffffff")
      mat.needsUpdate = true
      return
    }
    // Composition impossible (motif manquant/illisible) → on retombe sur la
    // base ci-dessous au lieu de laisser une texture obsolète figée.
  }
  if (layers.texturePath) {
    const tex = await loadTexture(layers.texturePath).catch(() => null)
    if (tex) {
      mat.map = tex
      mat.color.set("#ffffff")
    }
  } else {
    mat.map = null
    if (layers.color) mat.color.set(layers.color)
  }
  mat.needsUpdate = true
}

/**
 * Met à jour les calques des meshes ciblés et reconstruit leur matériau.
 * `color` et `texturePath` sont exclusifs : poser l'un efface l'autre.
 */
export async function applyMeshLayers(
  root: Object3D,
  meshName: string | string[],
  patch: MeshLayers
): Promise<void> {
  const meshes = findMeshes(root, meshName)
  await Promise.all(
    meshes.map((mesh) => {
      const data = mesh.userData as MeshUserData
      const next: MeshLayers = { ...(data.layers ?? {}), ...patch }
      if (patch.color != null) next.texturePath = null
      if (patch.texturePath != null) next.color = null
      data.layers = next
      return rebuildMeshMaterial(mesh, next)
    })
  )
}

/** Base texture (tissu / bois) : remplace la couleur unie, conserve le motif. */
export function swapTextureOnMesh(
  root: Object3D,
  meshName: string | string[],
  texturePath: string
): Promise<void> {
  return applyMeshLayers(root, meshName, { texturePath })
}

/** Couleur unie : remplace la texture de base, conserve le motif. */
export function applyColorToMesh(
  root: Object3D,
  meshName: string | string[],
  hex: string
): Promise<void> {
  return applyMeshLayers(root, meshName, { color: hex })
}

/** Overlay motif composé par-dessus la base. `path` vide/undefined = retire le motif. */
export function applyMotifToMesh(
  root: Object3D,
  meshName: string | string[],
  path: string | null | undefined
): Promise<void> {
  return applyMeshLayers(root, meshName, { motifPath: path ?? null })
}

export function disposeContext(ctx: ThreeContext, root: Object3D | null): void {
  if (root) {
    root.traverse((child) => {
      if (!(child instanceof Mesh)) return
      child.geometry?.dispose?.()
      const mat = child.material
      const materials = Array.isArray(mat) ? mat : [mat]
      for (const m of materials) {
        const standard = m as MeshStandardMaterial & { map?: Texture | null }
        standard.map?.dispose?.()
        standard.dispose?.()
      }
    })
    ctx.scene.remove(root)
  }
  ctx.controls.dispose()
  ctx.renderer.dispose()
  textureCache.forEach((p) => p.then((t) => t.dispose()).catch(() => undefined))
  textureCache.clear()
}
