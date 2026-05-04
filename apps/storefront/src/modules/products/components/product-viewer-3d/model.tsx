"use client"

// ──────────────────────────────────────────────────────────────────────
// <Model />
// Charge un fichier .glb via useGLTF, clone la scène pour l'isolation,
// puis applique en temps réel : couleur, texture de design, gravure.
//
// Convention importante pour vos modèles .glb :
//   - Mesh principal       → n'importe quel nom
//   - Mesh zone de gravure → doit s'appeler "Engraving"
//     (zone UV dédiée sur laquelle la CanvasTexture sera appliquée)
// ──────────────────────────────────────────────────────────────────────

import { useEffect, useMemo } from "react"
import { useGLTF } from "@react-three/drei"
import * as THREE from "three"
import type { CustomizationOptions } from "./types"

type ModelProps = {
  path: string
  options: CustomizationOptions
  position?: [number, number, number]
  scale?: number
}

/** Génère une CanvasTexture contenant le texte de gravure */
function buildEngravingTexture(text: string): THREE.CanvasTexture {
  const canvas = document.createElement("canvas")
  canvas.width  = 1024
  canvas.height = 256

  const ctx = canvas.getContext("2d")!
  ctx.clearRect(0, 0, 1024, 256)

  // Fond semi-transparent simulant le relief gravé
  ctx.fillStyle = "rgba(0, 0, 0, 0.12)"
  ctx.fillRect(0, 0, 1024, 256)

  // Texte
  ctx.font         = "bold 80px 'Noto Serif JP', serif"
  ctx.fillStyle    = "rgba(255, 255, 255, 0.55)"
  ctx.textAlign    = "center"
  ctx.textBaseline = "middle"
  ctx.fillText(text, 512, 128)

  return new THREE.CanvasTexture(canvas)
}

export function Model({ path, options, position = [0, 0, 0], scale = 1 }: ModelProps) {
  const { scene } = useGLTF(path)

  // Clone la scène + tous les materials à chaque nouveau GLB chargé
  const clonedScene = useMemo(() => {
    const clone = scene.clone(true)
    clone.traverse((child) => {
      if ((child as THREE.Mesh).isMesh) {
        const mesh = child as THREE.Mesh
        if (Array.isArray(mesh.material)) {
          mesh.material = mesh.material.map((m) => m.clone())
        } else {
          mesh.material = (mesh.material as THREE.Material).clone()
        }
      }
    })
    return clone
  }, [scene])

  // Applique les options de personnalisation en temps réel
  useEffect(() => {
    const loader   = new THREE.TextureLoader()
    let cancelled  = false

    clonedScene.traverse((child) => {
      if (!(child instanceof THREE.Mesh)) return
      const mat = child.material as THREE.MeshStandardMaterial
      if (!mat) return

      const isEngravingMesh = child.name === "Engraving"

      if (isEngravingMesh) {
        // ── Gravure ─────────────────────────────────────────────────
        if (options.engravingText.trim()) {
          mat.map         = buildEngravingTexture(options.engravingText)
          mat.transparent = true
          mat.alphaTest   = 0.01
        } else {
          mat.map         = null
          mat.transparent = false
        }
        mat.needsUpdate = true
        return
      }

      // ── Design (texture) ou couleur unie ────────────────────────
      if (options.texturePath) {
        loader.load(options.texturePath, (texture) => {
          if (cancelled) { texture.dispose(); return }
          texture.wrapS    = THREE.RepeatWrapping
          texture.wrapT    = THREE.RepeatWrapping
          texture.repeat.set(1, 1)
          mat.map          = texture
          mat.color.set("#ffffff") // La texture porte la couleur
          mat.needsUpdate  = true
        })
      } else {
        mat.map     = null
        mat.color.set(options.colorHex)
        mat.needsUpdate = true
      }
    })

    return () => { cancelled = true }
  }, [clonedScene, options.colorHex, options.texturePath, options.engravingText])

  return (
    <primitive
      object={clonedScene}
      position={position}
      scale={scale}
    />
  )
}
