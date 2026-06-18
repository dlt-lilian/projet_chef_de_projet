"use client"

import { HttpTypes } from "@medusajs/types"
import { useCallback, useRef } from "react"
import {
  ConfiguratorProductConfig,
  ConfiguratorTextureOption,
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

  const handleTextureChange = useCallback(
    (option: ConfiguratorTextureOption, choiceId: string) => {
      const choice = option.choices.find((c) => c.id === choiceId)
      if (!choice?.texturePath) return
      void viewerRef.current?.swapTexture(option.targetMesh, choice.texturePath)
    },
    []
  )

  // Apply initial selections as soon as the GLB is ready, so the model
  // reflects the swatches highlighted in the sidebar without requiring a click.
  const handleModelReady = useCallback(() => {
    for (const option of config.options) {
      if (option.type === "engraving") continue
      const path = controller.getSelectedTexturePath(option.id)
      if (!path) continue
      void viewerRef.current?.swapTexture(option.targetMesh, path)
    }
  }, [config, controller])

  return (
    <section
      className="flex flex-col md:flex-row w-full min-h-[80vh]"
      data-testid="configurator-layout"
    >
      <div className="flex-1 md:w-[60%] bg-stone-50">
        <ConfiguratorViewer
          ref={viewerRef}
          glbPath={config.glbPath}
          onModelReady={handleModelReady}
        />
      </div>
      <ConfiguratorSidebar
        product={product}
        config={config}
        controller={controller}
        onTextureChange={handleTextureChange}
      />
    </section>
  )
}
