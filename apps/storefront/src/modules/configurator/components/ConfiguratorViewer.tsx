"use client"

import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from "react"
import type { Object3D } from "three"
import {
  ThreeContext,
  disposeContext,
  initThreeScene,
  loadGLB,
  resizeRendererToCanvas,
  swapTextureOnMesh,
} from "../lib/three-helpers"

export type ConfiguratorViewerHandle = {
  swapTexture: (meshName: string, texturePath: string) => Promise<void>
}

type ConfiguratorViewerProps = {
  glbPath: string
  /** Vitesse d'auto-rotation des OrbitControls. 0 désactive l'auto-rotation. */
  rotationSpeed?: number
  onModelReady?: () => void
}

const ConfiguratorViewer = forwardRef<
  ConfiguratorViewerHandle,
  ConfiguratorViewerProps
>(function ConfiguratorViewer(
  { glbPath, rotationSpeed = 1.0, onModelReady },
  ref
) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const ctxRef = useRef<ThreeContext | null>(null)
  const modelRef = useRef<Object3D | null>(null)
  const onReadyRef = useRef<(() => void) | undefined>(onModelReady)
  onReadyRef.current = onModelReady
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useImperativeHandle(
    ref,
    () => ({
      async swapTexture(meshName: string, texturePath: string) {
        const root = modelRef.current
        if (!root) return
        await swapTextureOnMesh(root, meshName, texturePath)
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
      ctx.controls.update()
      ctx.renderer.render(ctx.scene, ctx.camera)
      rafId = requestAnimationFrame(animate)
    }

    setLoading(true)
    setError(null)

    loadGLB(glbPath, ctx)
      .then((root) => {
        if (cancelled) return
        modelRef.current = root
        ctx.scene.add(root)
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
      disposeContext(ctx, modelRef.current)
      modelRef.current = null
      ctxRef.current = null
    }
  }, [glbPath, rotationSpeed])

  return (
    <div className="relative w-full h-full min-h-[320px] md:min-h-[480px] bg-stone-100">
      <canvas
        ref={canvasRef}
        className="block w-full h-full"
        data-testid="configurator-canvas"
      />
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
