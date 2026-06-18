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
  ctx?: Pick<ThreeContext, "camera" | "controls">
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
        fitToView(pivot, inner, 2, ctx)
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
  ctx?: Pick<ThreeContext, "camera" | "controls">
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
  pivot.rotation.z = (90 * Math.PI) / 180

  if (!ctx) return
  const { camera, controls } = ctx
  const fov = (camera.fov * Math.PI) / 180
  const distance = targetSize / (2 * Math.tan(fov / 2)) + targetSize * 0.6
  camera.position.set(0, targetSize * 0.25, distance)
  camera.near = distance / 100
  camera.far = distance * 100
  camera.lookAt(0, 0, 0)
  camera.updateProjectionMatrix()

  controls.target.set(0, 0, 0)
  controls.minDistance = targetSize * 0.6
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
 * matche `meshName`. Si rien ne matche, log un avertissement et retourne tous
 * les meshes (fallback : applique la texture sur l'ensemble du modèle).
 */
export function findMeshes(root: Object3D, meshName?: string): Mesh[] {
  const all: Mesh[] = []
  root.traverse((child) => {
    if (child instanceof Mesh) all.push(child)
  })
  if (!meshName) return all
  const matched = all.filter(
    (m) => m.name === meshName || getMaterialName(m) === meshName
  )
  if (matched.length > 0) return matched

  // eslint-disable-next-line no-console
  console.warn(
    `[configurator] targetMesh "${meshName}" introuvable. ` +
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
 * Remplace la map diffuse de tous les meshes ciblés par la texture chargée
 * depuis `texturePath`. Si un mesh utilise un matériau non-standard, on le
 * remplace par un MeshStandardMaterial qui conserve la map.
 */
export async function swapTextureOnMesh(
  root: Object3D,
  meshName: string,
  texturePath: string
): Promise<void> {
  const meshes = findMeshes(root, meshName)
  if (meshes.length === 0) return
  const texture = await loadTexture(texturePath)

  for (const mesh of meshes) {
    const current = mesh.material
    if (current instanceof MeshStandardMaterial) {
      if (current.map && current.map !== texture) {
        current.map.dispose()
      }
      current.map = texture
      current.needsUpdate = true
      continue
    }
    mesh.material = new MeshStandardMaterial({ map: texture })
  }
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
