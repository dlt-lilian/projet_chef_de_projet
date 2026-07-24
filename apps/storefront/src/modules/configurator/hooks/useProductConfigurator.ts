"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import {
  ConfiguratorColorOption,
  ConfiguratorProductConfig,
  ConfiguratorTextureOption,
} from "../config/configurableProducts"
import {
  ConfiguratorState,
  loadConfiguratorState,
  saveConfiguratorState,
} from "../lib/persistence"

export type { ConfiguratorState }

export type UseProductConfiguratorReturn = {
  state: ConfiguratorState
  /** `true` une fois la restauration localStorage tentée (défauts sinon). */
  hydrated: boolean
  setSelection: (optionId: string, choiceId: string) => void
  setEngraving: (text: string) => void
  getSelectedTexturePath: (optionId: string) => string | undefined
  getSelectedChoiceId: (optionId: string) => string | undefined
  getTargetMesh: (optionId: string) => string | string[] | undefined
}

function buildInitialSelections(
  config: ConfiguratorProductConfig
): Record<string, string> {
  const initial: Record<string, string> = {}
  for (const option of config.options) {
    if (option.type === "engraving") continue
    // Honore le choix « par défaut » défini en admin, sinon le premier.
    const preferred =
      option.choices.find((c) => c.isDefault) ?? option.choices[0]
    if (preferred) initial[option.id] = preferred.id
  }
  return initial
}

export function useProductConfigurator(
  config: ConfiguratorProductConfig,
  /** Handle produit → clé de persistance localStorage. Optionnel (non persisté). */
  handle?: string
): UseProductConfiguratorReturn {
  const [state, setState] = useState<ConfiguratorState>(() => ({
    selections: buildInitialSelections(config),
    engraving: "",
  }))
  const [hydrated, setHydrated] = useState(false)

  // Restauration : au montage (client uniquement), fusionne les choix sauvegardés
  // par-dessus les défauts. Fait en effet — et non à l'init de `useState` — pour
  // éviter un mismatch d'hydratation SSR : serveur et premier rendu client
  // partent des défauts, puis on applique la version restaurée.
  // `handle` ne change pas sans remontage (chaque fiche produit = nouvelle route
  // → nouveau composant), donc cet effet s'exécute une fois par produit.
  useEffect(() => {
    const saved = handle ? loadConfiguratorState(handle, config) : null
    if (saved) {
      setState((prev) => ({
        selections: { ...prev.selections, ...saved.selections },
        engraving: saved.engraving ?? prev.engraving,
      }))
    }
    setHydrated(true)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [handle])

  // Sauvegarde à chaque changement, une fois l'hydratation faite (on n'écrase pas
  // le storage avec les défauts avant d'avoir tenté la restauration).
  useEffect(() => {
    if (hydrated && handle) saveConfiguratorState(handle, state)
  }, [hydrated, handle, state])

  const optionsById = useMemo(() => {
    const map = new Map<string, ConfiguratorTextureOption | ConfiguratorColorOption>()
    for (const option of config.options) {
      if (option.type !== "engraving") {
        map.set(option.id, option)
      }
    }
    return map
  }, [config])

  const setSelection = useCallback((optionId: string, choiceId: string) => {
    setState((prev) => ({
      ...prev,
      selections: { ...prev.selections, [optionId]: choiceId },
    }))
  }, [])

  const setEngraving = useCallback((text: string) => {
    setState((prev) => ({ ...prev, engraving: text }))
  }, [])

  const getSelectedTexturePath = useCallback(
    (optionId: string): string | undefined => {
      const option = optionsById.get(optionId)
      const choiceId = state.selections[optionId]
      if (!option || !choiceId) return undefined
      return option.choices.find((c) => c.id === choiceId)?.texturePath
    },
    [optionsById, state.selections]
  )

  const getSelectedChoiceId = useCallback(
    (optionId: string): string | undefined => state.selections[optionId],
    [state.selections]
  )

  const getTargetMesh = useCallback(
    (optionId: string): string | string[] | undefined =>
      optionsById.get(optionId)?.targetMesh,
    [optionsById]
  )

  return {
    state,
    hydrated,
    setSelection,
    setEngraving,
    getSelectedTexturePath,
    getSelectedChoiceId,
    getTargetMesh,
  }
}
