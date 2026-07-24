"use client"

import { HttpTypes } from "@medusajs/types"
import { lazy, Suspense, useCallback, useEffect, useRef, useState } from "react"
import {
  ConfiguratorOption,
  ConfiguratorProductConfig,
  darkenToTint,
} from "../config/configurableProducts"
import { useProductConfigurator } from "../hooks/useProductConfigurator"
import ConfiguratorSidebar from "./ConfiguratorSidebar"
import type { ConfiguratorViewerHandle } from "./ConfiguratorViewer"

// three.js (~1 Mo) est isolé dans un chunk chargé à la demande : absent du bundle
// des fiches produit standard, et différé (avec un squelette) sur les fiches
// configurables. `React.lazy` transmet le `ref` aux composants `forwardRef` (ce
// qu'est ConfiguratorViewer) → le pilotage impératif du modèle reste intact.
// `import type` ci-dessus : le type est effacé au build, il ne réintègre donc
// PAS le viewer dans le bundle statique.
const ConfiguratorViewer = lazy(() => import("./ConfiguratorViewer"))

type ConfiguratorLayoutProps = {
  product: HttpTypes.StoreProduct
  config: ConfiguratorProductConfig
}

export default function ConfiguratorLayout({
  product,
  config,
}: ConfiguratorLayoutProps) {
  const viewerRef = useRef<ConfiguratorViewerHandle>(null)
  const controller = useProductConfigurator(config, product.handle)
  const [modelReady, setModelReady] = useState(false)

  // Applique une sélection : couleur unie → applyColor, texture/motif → swapTexture.
  const applyOption = useCallback(
    (option: ConfiguratorOption, choiceId: string) => {
      if (option.type === "engraving") return
      const choice = option.choices.find((c) => c.id === choiceId)
      if (!choice) return
      if (option.type === "color") {
        if (choice.colorHex) {
          void viewerRef.current?.applyColor(option.targetMesh, choice.colorHex)
        }
        return
      }
      if (option.type === "motif") {
        // `choice.texturePath` peut être absent (choix « Aucun ») → retire l'overlay.
        void viewerRef.current?.applyMotif(option.targetMesh, choice.texturePath)
        return
      }
      if (choice.texturePath) {
        // `darken` (options bois) → teinte multiplicatrice qui assombrit bois_1.jpg.
        const tint =
          choice.darken != null ? darkenToTint(choice.darken) : undefined
        void viewerRef.current?.swapTexture(
          option.targetMesh,
          choice.texturePath,
          tint
        )
      }
    },
    []
  )

  // Applique toutes les sélections courantes au modèle (état par défaut OU
  // restauré). Textures/motifs d'abord, puis couleurs : sur un mesh partagé la
  // couleur unie l'emporte par défaut (cohérent avec l'ancien système où
  // "uni" = couleur).
  const applyAllOptions = useCallback(() => {
    const apply = (option: ConfiguratorOption) => {
      const choiceId = controller.getSelectedChoiceId(option.id)
      if (choiceId) applyOption(option, choiceId)
    }
    config.options.filter((o) => o.type !== "color").forEach(apply)
    config.options.filter((o) => o.type === "color").forEach(apply)
  }, [config, controller, applyOption])

  // `controller` (donc `applyAllOptions`) change d'identité à chaque rendu : on
  // garde la dernière version dans un ref pour que l'effet ci-dessous ne se
  // redéclenche QUE sur (modelReady, hydrated) tout en lisant l'état à jour.
  const applyAllRef = useRef(applyAllOptions)
  applyAllRef.current = applyAllOptions

  const handleModelReady = useCallback(() => setModelReady(true), [])

  // Applique les choix au modèle une fois qu'il est chargé ET la restauration
  // localStorage effectuée, quel que soit l'ordre des deux. En pratique le GLB
  // distant met plusieurs secondes à charger : la restauration (synchrone au
  // montage) est déjà faite quand le modèle arrive ; cet effet couvre la course
  // rare inverse, où le modèle serait prêt avant la restauration.
  useEffect(() => {
    if (modelReady && controller.hydrated) applyAllRef.current()
  }, [modelReady, controller.hydrated])

  // Zoom contextuel : à l'ouverture d'un menu d'option, cadre la caméra sur le
  // mesh ciblé (Bois, Vis, Papier…) ; à la fermeture (ou option sans mesh, ex.
  // gravure), revient à la vue initiale du modèle.
  const handleActiveOption = useCallback(
    (optionId: string | null) => {
      const viewer = viewerRef.current
      if (!viewer) return
      const option = optionId
        ? config.options.find((o) => o.id === optionId)
        : undefined
      const target = option?.targetMesh
      if (target) viewer.focusMeshes(target)
      else viewer.resetView()
    },
    [config]
  )

  return (
    <section
      className="flex flex-col md:flex-row w-full h-[calc(100dvh-61px)] md:h-auto md:min-h-[80vh]"
      data-testid="configurator-layout"
    >
      <div className="flex-1 min-h-0 w-full md:w-[60%] bg-stone-50">
        <Suspense
          fallback={
            <div className="w-full h-full min-h-[240px] md:min-h-[480px] bg-stone-100 flex items-center justify-center">
              <div className="px-3 py-1.5 rounded-full bg-white/80 text-sm text-stone-700 shadow-sm">
                Chargement du configurateur…
              </div>
            </div>
          }
        >
          <ConfiguratorViewer
            ref={viewerRef}
            glbPath={config.glbPath}
            rotationSpeed={config.autoRotate === false ? 0 : 1}
            modelRotationDeg={config.modelRotationDeg}
            onModelReady={handleModelReady}
          />
        </Suspense>
      </div>
      <ConfiguratorSidebar
        product={product}
        config={config}
        controller={controller}
        onOptionChange={applyOption}
        onActiveOptionChange={handleActiveOption}
      />
    </section>
  )
}
