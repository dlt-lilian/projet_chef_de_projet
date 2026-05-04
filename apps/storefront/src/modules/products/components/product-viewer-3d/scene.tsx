"use client"

// ──────────────────────────────────────────────────────────────────────
// <ProductViewerScene />
// Scène React Three Fiber complète.
// Gère le cas standard (1 modèle) et le cas Pack (3 modèles côte à côte).
// ──────────────────────────────────────────────────────────────────────

import { Suspense, Component, ReactNode } from "react"
import { Canvas } from "@react-three/fiber"
import { OrbitControls, Environment, ContactShadows } from "@react-three/drei"
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
      // ✅ Pas de `shadows` → évite PCFSoftShadowMap deprecated + charge GPU
      gl={{
        antialias: true,
        alpha: true,
        powerPreference: "default",
        failIfMajorPerformanceCaveat: false,
      }}
      // ✅ Ne re-render que sur interaction → évite la perte de contexte WebGL
      frameloop="demand"
      onCreated={({ gl }) => {
        gl.shadowMap.enabled = false
        gl.toneMapping = THREE.ACESFilmicToneMapping
        gl.toneMappingExposure = 1.2
        // Dispose proprement à l'unmount (évite les fuites de contexte WebGL)
        return () => gl.dispose()
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
          <SceneContent handle={handle} options={options} />
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
