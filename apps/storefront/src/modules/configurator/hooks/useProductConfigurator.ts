"use client"

import { useCallback, useMemo, useState } from "react"
import {
  ConfiguratorProductConfig,
  ConfiguratorTextureOption,
} from "../config/configurableProducts"

export type ConfiguratorState = {
  selections: Record<string, string>
  engraving: string
}

export type UseProductConfiguratorReturn = {
  state: ConfiguratorState
  setSelection: (optionId: string, choiceId: string) => void
  setEngraving: (text: string) => void
  getSelectedTexturePath: (optionId: string) => string | undefined
  getSelectedChoiceId: (optionId: string) => string | undefined
  getTargetMesh: (optionId: string) => string | undefined
}

function buildInitialSelections(
  config: ConfiguratorProductConfig
): Record<string, string> {
  const initial: Record<string, string> = {}
  for (const option of config.options) {
    if (option.type === "engraving") continue
    const first = option.choices[0]
    if (first) initial[option.id] = first.id
  }
  return initial
}

export function useProductConfigurator(
  config: ConfiguratorProductConfig
): UseProductConfiguratorReturn {
  const [state, setState] = useState<ConfiguratorState>(() => ({
    selections: buildInitialSelections(config),
    engraving: "",
  }))

  const optionsById = useMemo(() => {
    const map = new Map<string, ConfiguratorTextureOption>()
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
    (optionId: string): string | undefined =>
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
