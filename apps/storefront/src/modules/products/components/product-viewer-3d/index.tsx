"use client"

// ──────────────────────────────────────────────────────────────────────
// <ProductViewer3D />
// Point d'entrée public du viewer.
// Chargé dynamiquement (ssr: false) car WebGL n'existe pas côté serveur.
// ──────────────────────────────────────────────────────────────────────

import dynamic from "next/dynamic"
import type { ProductHandle, CustomizationOptions } from "./types"

export type { ProductHandle, CustomizationOptions }

type Props = {
  handle: ProductHandle
  options: CustomizationOptions
  /** Hauteur du conteneur — défaut 520px */
  height?: string
}

const ProductViewerScene = dynamic(
  () => import("./scene").then((m) => m.ProductViewerScene),
  {
    ssr: false,
    loading: () => (
      <div className="w-full h-full flex items-center justify-center bg-neutral-50">
        <div className="flex flex-col items-center gap-3 text-neutral-400">
          {/* Spinner discret */}
          <svg className="animate-spin w-8 h-8" viewBox="0 0 24 24" fill="none">
            <circle
              className="opacity-25"
              cx="12" cy="12" r="10"
              stroke="currentColor" strokeWidth="2"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
            />
          </svg>
          <span className="text-sm tracking-widest uppercase">Chargement du modèle</span>
        </div>
      </div>
    ),
  }
)

export function ProductViewer3D({ handle, options, height = "520px" }: Props) {
  return (
    <div
      className="relative w-full rounded-2xl overflow-hidden bg-neutral-50"
      style={{ height }}
      aria-label="Aperçu 3D du produit — faites glisser pour pivoter"
    >
      <ProductViewerScene handle={handle} options={options} />

      {/* Hint interaction */}
      <p className="absolute bottom-3 left-1/2 -translate-x-1/2 text-[11px] text-neutral-400 tracking-wider select-none pointer-events-none">
        Glissez pour pivoter · Scroll pour zoomer
      </p>
    </div>
  )
}
