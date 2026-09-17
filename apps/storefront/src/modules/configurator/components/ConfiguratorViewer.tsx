"use client"

import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from "react"
import Image from "next/image"
import { Group, Vector3, type Object3D } from "three"
import {
  buildEngraving,
  clearEngraving,
  type EngravingPreviewConfig,
  type EngravingResult,
} from "../lib/engraving"
import {
  ThreeContext,
  animateCameraTo,
  applyColorToMesh,
  applyMotifToMesh,
  disposeContext,
  focusOnMeshes,
  initThreeScene,
  loadGLB,
  resizeRendererToCanvas,
  swapTextureOnMesh,
} from "../lib/three-helpers"

type MeshTarget = string | string[]

/** Vue « maison » du modèle, capturée après chargement, pour le reset. */
type HomeView = {
  position: Vector3
  target: Vector3
  minDistance: number
  maxDistance: number
  autoRotate: boolean
}

export type ConfiguratorViewerHandle = {
  swapTexture: (
    meshName: MeshTarget,
    texturePath: string,
    tint?: string | null
  ) => Promise<void>
  applyColor: (meshName: MeshTarget, hex: string) => Promise<void>
  applyMotif: (
    meshName: MeshTarget,
    path: string | null | undefined
  ) => Promise<void>
  /** Cadre la caméra sur le(s) mesh(es) ciblé(s) (zoom contextuel). */
  focusMeshes: (meshName: MeshTarget) => void
  /** Revient à la vue initiale du modèle. */
  resetView: () => void
  /** Affiche le texte gravé sur le modèle (vide = retire). Sans effet si le
      produit n'a pas d'aperçu de gravure. */
  setEngraving: (text: string) => Promise<void>
  /** Cadre la caméra face à la gravure. Retourne false s'il n'y en a pas. */
  focusEngraving: () => boolean
}

type ConfiguratorViewerProps = {
  glbPath: string
  /** Vitesse d'auto-rotation des OrbitControls. 0 désactive l'auto-rotation. */
  rotationSpeed?: number
  /** Orientation initiale du modèle en degrés [x, y, z] (défaut : [0, 0, 90]). */
  modelRotationDeg?: [number, number, number]
  onModelReady?: () => void
  /**
   * Visuel affiché derrière le canvas pendant le chargement du GLB.
   *
   * Le même poster couvre déjà le chargement du chunk three.js, côté
   * ConfiguratorLayout. Le reprendre ici évite qu'il ne cède la place à un
   * aplat gris entre les deux phases : le visiteur voit le produit en continu,
   * de la première peinture jusqu'au modèle 3D.
   */
  posterSrc?: string
  /** Texte alternatif du poster. Requis dès que `posterSrc` est fourni. */
  posterAlt?: string
  /** Réglages de l'aperçu 3D de la gravure ; absent = pas d'aperçu. */
  engravingPreview?: EngravingPreviewConfig
}

const ConfiguratorViewer = forwardRef<
  ConfiguratorViewerHandle,
  ConfiguratorViewerProps
>(function ConfiguratorViewer(
  {
    glbPath,
    rotationSpeed = 1.0,
    modelRotationDeg,
    onModelReady,
    posterSrc,
    posterAlt,
    engravingPreview,
  },
  ref
) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const ctxRef = useRef<ThreeContext | null>(null)
  const modelRef = useRef<Object3D | null>(null)
  const homeRef = useRef<HomeView | null>(null)
  const onReadyRef = useRef<(() => void) | undefined>(onModelReady)
  onReadyRef.current = onModelReady
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Gravure : groupe dans la scène (cf. buildEngraving), dernier texte demandé,
  // et compteur qui invalide une reconstruction dépassée (chargement de police).
  const engravingPreviewRef = useRef(engravingPreview)
  engravingPreviewRef.current = engravingPreview
  const engravingGroupRef = useRef<Group | null>(null)
  const engravingTextRef = useRef("")
  const engravingResultRef = useRef<EngravingResult | null>(null)
  const engravingRunRef = useRef(0)

  const refreshEngraving = async () => {
    const ctx = ctxRef.current
    const root = modelRef.current
    const home = homeRef.current
    const config = engravingPreviewRef.current
    if (!ctx || !root || !home || !config) return
    if (!engravingGroupRef.current) {
      const group = new Group()
      group.name = "configurator-engraving"
      ctx.scene.add(group)
      engravingGroupRef.current = group
    }
    const run = ++engravingRunRef.current
    const result = await buildEngraving({
      group: engravingGroupRef.current,
      root,
      config,
      text: engravingTextRef.current,
      homePosition: home.position,
      homeTarget: home.target,
      isStale: () => run !== engravingRunRef.current,
    })
    if (run === engravingRunRef.current) engravingResultRef.current = result
  }

  useImperativeHandle(
    ref,
    () => ({
      // La couleur de la gravure dépend du fond (claire sur bois sombre) :
      // chaque changement de matière la redessine.
      async swapTexture(
        meshName: MeshTarget,
        texturePath: string,
        tint?: string | null
      ) {
        const root = modelRef.current
        if (!root) return
        await swapTextureOnMesh(root, meshName, texturePath, tint)
        void refreshEngraving()
      },
      async applyColor(meshName: MeshTarget, hex: string) {
        const root = modelRef.current
        if (!root) return
        await applyColorToMesh(root, meshName, hex)
        void refreshEngraving()
      },
      async applyMotif(meshName: MeshTarget, path: string | null | undefined) {
        const root = modelRef.current
        if (!root) return
        await applyMotifToMesh(root, meshName, path)
        void refreshEngraving()
      },
      setEngraving(text: string) {
        engravingTextRef.current = text
        return refreshEngraving()
      },
      focusEngraving() {
        const ctx = ctxRef.current
        const result = engravingResultRef.current
        if (!ctx || !result) return false
        const center = result.box.getCenter(new Vector3())
        const size = result.box.getSize(new Vector3())
        // Face au texte (et non dans l'axe de vue courant, comme focusMeshes) :
        // l'auto-rotation a pu amener la caméra du côté non gravé.
        const distance = Math.max(size.length() * 2.6, 0.3)
        ctx.controls.autoRotate = false
        ctx.controls.minDistance = 0.01
        animateCameraTo(
          ctx,
          center.clone().addScaledVector(result.normal, distance),
          center
        )
        return true
      },
      focusMeshes(meshName: MeshTarget) {
        const ctx = ctxRef.current
        const root = modelRef.current
        const home = homeRef.current
        if (!ctx || !root) return
        // Pendant le focus : pas d'auto-rotation, et on relâche la distance min
        // pour autoriser un zoom rapproché sans que les contrôles ne le rognent.
        ctx.controls.autoRotate = false
        ctx.controls.minDistance = 0.01
        // Plafond = ~90 % de la distance de la vue maison : un grand mesh (le
        // papier) avance légèrement au lieu de reculer ; les petits meshes (bois,
        // vis), déjà plus proches que ce plafond, restent inchangés.
        const maxDistance = home
          ? home.position.distanceTo(home.target) * 0.65
          : undefined
        focusOnMeshes(ctx, root, meshName, { maxDistance })
      },
      resetView() {
        const ctx = ctxRef.current
        const home = homeRef.current
        if (!ctx || !home) return
        ctx.controls.minDistance = home.minDistance
        ctx.controls.maxDistance = home.maxDistance
        ctx.controls.autoRotate = home.autoRotate
        animateCameraTo(ctx, home.position, home.target)
      },
    }),
    []
  )

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    let cancelled = false
    let rafId = 0

    const ctx = initThreeScene(canvas)
    ctxRef.current = ctx
    ctx.controls.autoRotate = rotationSpeed !== 0
    ctx.controls.autoRotateSpeed = rotationSpeed

    const animate = () => {
      if (cancelled) return
      resizeRendererToCanvas(ctx)
      const anim = ctx.anim
      if (anim) {
        const now =
          typeof performance !== "undefined" ? performance.now() : Date.now()
        const t =
          anim.duration > 0 ? Math.min(1, (now - anim.start) / anim.duration) : 1
        // easeInOutCubic
        const e = t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2
        ctx.camera.position.lerpVectors(anim.fromPos, anim.toPos, e)
        ctx.controls.target.lerpVectors(anim.fromTarget, anim.toTarget, e)
        ctx.camera.lookAt(ctx.controls.target)
        if (t >= 1) ctx.anim = null
      } else {
        ctx.controls.update()
      }
      ctx.renderer.render(ctx.scene, ctx.camera)
      rafId = requestAnimationFrame(animate)
    }

    setLoading(true)
    setError(null)

    loadGLB(glbPath, ctx, modelRotationDeg)
      .then((root) => {
        if (cancelled) return
        modelRef.current = root
        ctx.scene.add(root)
        // Mémorise la vue initiale (position, cible, distances, auto-rotation)
        // pour pouvoir y revenir via resetView() quand un menu se referme.
        homeRef.current = {
          position: ctx.camera.position.clone(),
          target: ctx.controls.target.clone(),
          minDistance: ctx.controls.minDistance,
          maxDistance: ctx.controls.maxDistance,
          autoRotate: ctx.controls.autoRotate,
        }
        setLoading(false)
        onReadyRef.current?.()
      })
      .catch((err: unknown) => {
        if (cancelled) return
        const message =
          err instanceof Error ? err.message : "Erreur de chargement du modèle"
        setError(message)
        setLoading(false)
      })

    rafId = requestAnimationFrame(animate)

    const handleResize = () => resizeRendererToCanvas(ctx)
    window.addEventListener("resize", handleResize)

    return () => {
      cancelled = true
      cancelAnimationFrame(rafId)
      window.removeEventListener("resize", handleResize)
      // La gravure appartient à cette scène : un rechargement du modèle la
      // reconstruit (via onModelReady) dans la suivante.
      engravingRunRef.current++
      if (engravingGroupRef.current) clearEngraving(engravingGroupRef.current)
      engravingGroupRef.current = null
      engravingResultRef.current = null
      disposeContext(ctx, modelRef.current)
      modelRef.current = null
      ctxRef.current = null
    }
  }, [glbPath, rotationSpeed, modelRotationDeg])

  return (
    <div className="relative w-full h-full min-h-[240px] md:min-h-[480px] bg-stone-100">
      <canvas
        ref={canvasRef}
        className="block w-full h-full"
        data-testid="configurator-canvas"
      />
      {loading && !error && posterSrc && (
        <Image
          src={posterSrc}
          alt={posterAlt ?? ""}
          fill
          sizes="(max-width: 768px) 100vw, 60vw"
          className="object-contain pointer-events-none"
        />
      )}
      {loading && !error && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="px-3 py-1.5 rounded-full bg-white/80 text-sm text-stone-700 shadow-sm">
            Chargement du modèle…
          </div>
        </div>
      )}
      {error && (
        <div className="absolute inset-0 flex items-center justify-center p-4">
          <div className="px-3 py-1.5 rounded-md bg-red-50 text-sm text-red-700 border border-red-200">
            {error}
          </div>
        </div>
      )}
    </div>
  )
})

export default ConfiguratorViewer
