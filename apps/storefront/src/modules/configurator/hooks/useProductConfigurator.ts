"use client"

import { useCallback, useMemo, useState } from "react"
import {
  ConfiguratorColorOption,
  ConfiguratorProductConfig,
  ConfiguratorTextureOption,
} from "../config/configurableProducts"
import { ConfiguratorState, InitialConfiguration } from "../lib/persistence"

export type { ConfiguratorState }

export type UseProductConfiguratorReturn = {
  state: ConfiguratorState
  setSelection: (optionId: string, choiceId: string) => void
  setEngraving: (text: string) => void
  getSelectedTexturePath: (optionId: string) => string | undefined
  getSelectedChoiceId: (optionId: string) => string | undefined
  getTargetMesh: (optionId: string) => string | string[] | undefined
}

/**
 * Choix par défaut : le choix « par défaut » défini en admin, sinon le premier,
 * puis on surcharge avec la config initiale (rouverture d'un article du panier),
 * en ne gardant que les choix encore valides pour la config courante.
 */
function buildInitialState(
  config: ConfiguratorProductConfig,
  initial?: InitialConfiguration
): ConfiguratorState {
  const selections: Record<string, string> = {}
  for (const option of config.options) {
    if (option.type === "engraving") continue
    const preferred =
      option.choices.find((c) => c.isDefault) ?? option.choices[0]
    if (preferred) selections[option.id] = preferred.id
    // Surcharge par la config restaurée, si le choix existe toujours.
    const restored = initial?.selections?.[option.id]
    if (restored && option.choices.some((c) => c.id === restored)) {
      selections[option.id] = restored
    }
  }
  return { selections, engraving: initial?.engraving ?? "" }
}

export function useProductConfigurator(
  config: ConfiguratorProductConfig,
  /** Config restaurée (ex. rouverture d'une ligne de panier via `?line=`). */
  initialConfiguration?: InitialConfiguration
): UseProductConfiguratorReturn {
  // Fournie par le serveur (déterministe) → identique en SSR et au 1er rendu
  // client, donc pas de mismatch d'hydratation.
  const [state, setState] = useState<ConfiguratorState>(() =>
    buildInitialState(config, initialConfiguration)
  )

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
    setSelection,
    setEngraving,
    getSelectedTexturePath,
    getSelectedChoiceId,
    getTargetMesh,
  }
}
