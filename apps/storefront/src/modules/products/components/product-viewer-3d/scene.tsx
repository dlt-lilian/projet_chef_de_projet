"use client"

import { Suspense, Component, ReactNode } from "react"
import { Canvas } from "@react-three/fiber"
import { OrbitControls, Environment, ContactShadows, Bounds } from "@react-three/drei"
import * as THREE from "three"
import { Model } from "./model"
import { PACK_MODELS, MODEL_PATHS } from "@lib/constants/kogei-customization"
import type { CustomizationOptions, ProductHandle } from "./types"


type Props = {
  handle: ProductHandle
  options: CustomizationOptions
}

// ── Error boundary pour attraper les erreurs GLB manquant ────────────
class SceneErrorBoundary extends Component<
  { children: ReactNode },
  { hasError: boolean }
> {
  state = { hasError: false }
  static getDerivedStateFromError() { return { hasError: true } }
  render() {
    if (this.state.hasError) {
      return (
        <mesh>
          <boxGeometry args={[1, 1, 1]} />
          <meshStandardMaterial color="#C4A882" wireframe />
        </mesh>
      )
    }
    return this.props.children
  }
}

// ── Fallback pendant le chargement du GLB ────────────────────────────
function LoadingFallback() {
  return (
    <mesh>
      <torusGeometry args={[0.6, 0.08, 16, 60]} />
      <meshStandardMaterial color="#C4A882" wireframe />
    </mesh>
  )
}

// ── Contenu de la scène ──────────────────────────────────────────────
function SceneContent({ handle, options }: Props) {
  if (handle === "pack-kogei") {
    return (
      <>
        {PACK_MODELS.map((m) => (
          <Model
            key={m.path}
            path={m.path}
            options={options}
            position={m.position}
            scale={m.scale}
          />
        ))}
      </>
    )
  }

  const modelPath = MODEL_PATHS[handle]
  if (!modelPath) return null

  return <Model path={modelPath} options={options} />
}

// ── Scène principale ─────────────────────────────────────────────────
export function ProductViewerScene({ handle, options }: Props) {
  return (
    <Canvas
      className="w-full h-full"
      camera={{ position: [0, 1.5, 4], fov: 45 }}
      dpr={[1, 1.5]}                           // ← limite la résolution rendue
      gl={{
        antialias: true,
        alpha: true,
        powerPreference: "high-performance",   // ← évite le GPU intégré faible
        failIfMajorPerformanceCaveat: false,
        preserveDrawingBuffer: false,
      }}
      onCreated={({ gl, invalidate }) => {
        gl.shadowMap.enabled = false
        gl.toneMapping = THREE.ACESFilmicToneMapping
        gl.toneMappingExposure = 1.2

        // ── Récupération automatique du contexte WebGL ──
        const canvas = gl.domElement
        canvas.addEventListener("webglcontextlost", (e) => {
          e.preventDefault()                    // permet la restauration
          console.warn("[3D] WebGL context lost")
        }, false)
        canvas.addEventListener("webglcontextrestored", () => {
          console.info("[3D] WebGL context restored")
          invalidate()                          // redemande une frame
        }, false)
      }}
    >
      <ambientLight intensity={0.5} />
      <directionalLight position={[5, 8, 5]}  intensity={1.2} />
      <pointLight      position={[-4, 3, -3]} intensity={0.4} color="#ffd6a0" />

      <Environment preset="studio" />

      {/* Ombre au sol sans shadow maps GPU */}
      <ContactShadows
        position={[0, -1.2, 0]}
        opacity={0.3}
        scale={8}
        blur={2.5}
        far={4}
        frames={1}
      />

      <SceneErrorBoundary>
        <Suspense fallback={<LoadingFallback />}>
          <Bounds fit clip observe margin={1.2}>
            <SceneContent handle={handle} options={options} />
          </Bounds>
        </Suspense>
      </SceneErrorBoundary>

      {/* makeDefault invalide le frame à chaque interaction (requis avec frameloop="demand") */}
      <OrbitControls
        enablePan={false}
        minDistance={2}
        maxDistance={8}
        maxPolarAngle={Math.PI / 1.8}
        autoRotate
        autoRotateSpeed={0.6}
        makeDefault
      />
    </Canvas>
  )
}
