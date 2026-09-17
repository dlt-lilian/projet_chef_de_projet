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
 * Options qui se disputent la même surface : couleur unie ET texture posent la
 * matière DE BASE d'un mesh (cf. `applyMeshLayers`, où poser l'une efface
 * l'autre). Deux options qui visent le même mesh sont donc exclusives : sur les
 * baguettes, « Bois laquée » et « Bois naturelle » ne peuvent pas coexister.
 * Les motifs, eux, sont un calque par-dessus : ils ne sont jamais en conflit.
 *
 * `targetMesh` absent = tous les meshes du modèle (cf. `findMeshes`) : une telle
 * option est en conflit avec toutes les autres de base.
 */
function baseLayerConflicts(
  config: ConfiguratorProductConfig,
  optionId: string
): string[] {
  const options = config.options.filter(
    (o) => o.type === "color" || o.type === "texture"
  )
  const option = options.find((o) => o.id === optionId)
  if (!option) return []
  const meshesOf = (target: string | string[] | undefined) =>
    target === undefined ? null : Array.isArray(target) ? target : [target]
  const own = meshesOf(option.targetMesh)

  return options
    .filter((other) => {
      if (other.id === optionId) return false
      const theirs = meshesOf(other.targetMesh)
      if (own === null || theirs === null) return true
      return theirs.some((mesh) => own.includes(mesh))
    })
    .map((other) => other.id)
}

/**
 * Choix par défaut : le choix « par défaut » défini en admin, sinon le premier,
 * puis on surcharge avec la config initiale (rouverture d'un article du panier),
 * en ne gardant que les choix encore valides pour la config courante.
 *
 * Un groupe d'options exclusives (cf. `baseLayerConflicts`) n'en garde qu'une :
 * sans ça, les deux s'affichaient cochées à l'ouverture alors qu'une seule est
 * réellement rendue.
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

  // Résolution des conflits : le choix restauré depuis le panier l'emporte,
  // sinon la couleur unie — c'est elle que le modèle affiche, les couleurs
  // étant appliquées après les textures (cf. `handleModelReady`).
  for (const option of config.options) {
    if (option.type !== "color" && option.type !== "texture") continue
    if (!selections[option.id]) continue
    const conflicts = baseLayerConflicts(config, option.id)
    const restoredHere = !!initial?.selections?.[option.id]
    const restoredElsewhere = conflicts.some((id) => initial?.selections?.[id])
    const wins = restoredHere || (!restoredElsewhere && option.type === "color")
    if (!wins) continue
    for (const id of conflicts) delete selections[id]
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

  const setSelection = useCallback(
    (optionId: string, choiceId: string) => {
      setState((prev) => {
        const selections = { ...prev.selections, [optionId]: choiceId }
        // Choisir une matière de base décoche celle qui la remplace sur le
        // modèle (couleur unie ↔ texture du même mesh).
        for (const id of baseLayerConflicts(config, optionId)) {
          delete selections[id]
        }
        return { ...prev, selections }
      })
    },
    [config]
  )

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
