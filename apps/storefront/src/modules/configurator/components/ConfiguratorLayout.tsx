"use client"

import { HttpTypes } from "@medusajs/types"
import { useCallback, useRef } from "react"
import {
  ConfiguratorOption,
  ConfiguratorProductConfig,
} from "../config/configurableProducts"
import { useProductConfigurator } from "../hooks/useProductConfigurator"
import ConfiguratorSidebar from "./ConfiguratorSidebar"
import ConfiguratorViewer, {
  ConfiguratorViewerHandle,
} from "./ConfiguratorViewer"

type ConfiguratorLayoutProps = {
  product: HttpTypes.StoreProduct
  config: ConfiguratorProductConfig
}

export default function ConfiguratorLayout({
  product,
  config,
}: ConfiguratorLayoutProps) {
  const viewerRef = useRef<ConfiguratorViewerHandle>(null)
  const controller = useProductConfigurator(config)

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
        void viewerRef.current?.swapTexture(option.targetMesh, choice.texturePath)
      }
    },
    []
  )

  // Apply initial selections as soon as the GLB is ready, so the model reflects
  // the swatches highlighted in the sidebar without requiring a click.
  // Textures/motifs d'abord, puis couleurs : sur un mesh partagé la couleur unie
  // l'emporte par défaut (cohérent avec l'ancien système où "uni" = couleur).
  const handleModelReady = useCallback(() => {
    const apply = (option: ConfiguratorOption) => {
      const choiceId = controller.getSelectedChoiceId(option.id)
      if (choiceId) applyOption(option, choiceId)
    }
    config.options.filter((o) => o.type !== "color").forEach(apply)
    config.options.filter((o) => o.type === "color").forEach(apply)
  }, [config, controller, applyOption])

  return (
    <section
      className="flex flex-col md:flex-row w-full min-h-[80vh]"
      data-testid="configurator-layout"
    >
      <div className="flex-1 md:w-[60%] bg-stone-50">
        <ConfiguratorViewer
          ref={viewerRef}
          glbPath={config.glbPath}
          rotationSpeed={config.autoRotate === false ? 0 : 1}
          modelRotationDeg={config.modelRotationDeg}
          onModelReady={handleModelReady}
        />
      </div>
      <ConfiguratorSidebar
        product={product}
        config={config}
        controller={controller}
        onOptionChange={applyOption}
      />
    </section>
  )
}
