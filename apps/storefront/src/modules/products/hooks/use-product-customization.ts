"use client"

// ─────────────────────────────────────────────────────────────
// useProductCustomization
// Gère l'état local couleur / design / gravure
// Retourne aussi les métadonnées à passer au cart line item
// ─────────────────────────────────────────────────────────────

import { useState, useCallback, useMemo } from "react"
import {
  DEFAULT_COLOR,
  DEFAULT_DESIGN,
} from "@lib/constants/kogei-customization"
import type { ColorOption, CustomizationState, DesignOption } from "@modules/products/components/product-viewer-3d/types"

export function useProductCustomization() {
  const [state, setState] = useState<CustomizationState>({
    color: DEFAULT_COLOR,
    design: DEFAULT_DESIGN,
    engravingText: "",
  })

  const setColor = useCallback((color: ColorOption) => {
    setState((prev) => ({ ...prev, color }))
  }, [])

  const setDesign = useCallback((design: DesignOption) => {
    setState((prev) => ({ ...prev, design }))
  }, [])

  const setEngravingText = useCallback((text: string) => {
    setState((prev) => ({ ...prev, engravingText: text.slice(0, 30) }))
  }, [])

  /** Options normalisées pour le composant 3D */
  const viewerOptions = useMemo(() => ({
    colorHex:     state.color.hex,
    texturePath:  state.design.texturePath,
    engravingText: state.engravingText,
  }), [state])

  /**
   * Métadonnées à injecter dans le cart line item via l'API Medusa.
   * Passer dans addToCart() : { metadata: cartMetadata }
   */
  const cartMetadata = useMemo(() => ({
    customization_color:    state.color.id,
    customization_design:   state.design.id,
    customization_engraving: state.engravingText || null,
  }), [state])

  return {
    state,
    viewerOptions,
    cartMetadata,
    setColor,
    setDesign,
    setEngravingText,
  }
}
