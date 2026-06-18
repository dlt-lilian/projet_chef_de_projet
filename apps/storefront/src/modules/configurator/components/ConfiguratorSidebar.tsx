"use client"

import { addToCart } from "@lib/data/cart"
import { HttpTypes } from "@medusajs/types"
import { Button, clx, Input, Label } from "@modules/common/components/ui"
import ProductPrice from "@modules/products/components/product-price"
import { useParams } from "next/navigation"
import { useState } from "react"
import {
  ConfiguratorOption,
  ConfiguratorProductConfig,
  ConfiguratorTextureOption,
} from "../config/configurableProducts"
import { UseProductConfiguratorReturn } from "../hooks/useProductConfigurator"

type ConfiguratorSidebarProps = {
  product: HttpTypes.StoreProduct
  config: ConfiguratorProductConfig
  controller: UseProductConfiguratorReturn
  onTextureChange: (option: ConfiguratorTextureOption, choiceId: string) => void
}

const ENGRAVING_MAX_LENGTH = 30

export default function ConfiguratorSidebar({
  product,
  config,
  controller,
  onTextureChange,
}: ConfiguratorSidebarProps) {
  const countryCode = useParams().countryCode as string
  const [isAdding, setIsAdding] = useState(false)

  const variant = product.variants?.[0]

  const handleAddToCart = async () => {
    if (!variant?.id) return
    setIsAdding(true)
    try {
      await addToCart({ variantId: variant.id, quantity: 1, countryCode })
    } finally {
      setIsAdding(false)
    }
  }

  return (
    <aside className="flex flex-col gap-6 w-full md:w-[40%] md:max-w-[420px] md:min-w-[320px] p-6 md:border-l border-stone-200 bg-white">
      <header className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold text-stone-900">
          {product.title}
        </h1>
        {product.subtitle && (
          <p className="text-sm text-stone-600">{product.subtitle}</p>
        )}
      </header>

      <div className="flex flex-col gap-6">
        {config.options.map((option) => (
          <OptionRow
            key={option.id}
            option={option}
            controller={controller}
            onTextureChange={onTextureChange}
          />
        ))}
      </div>

      <div className="mt-auto flex flex-col gap-3 pt-6 border-t border-stone-200">
        <ProductPrice product={product} variant={variant} />
        <Button
          onClick={handleAddToCart}
          disabled={!variant || isAdding}
          isLoading={isAdding}
          variant="primary"
          className="w-full h-11"
          data-testid="configurator-add-to-cart"
        >
          Ajouter au panier
        </Button>
      </div>
    </aside>
  )
}

type OptionRowProps = {
  option: ConfiguratorOption
  controller: UseProductConfiguratorReturn
  onTextureChange: (option: ConfiguratorTextureOption, choiceId: string) => void
}

function OptionRow({ option, controller, onTextureChange }: OptionRowProps) {
  if (option.type === "engraving") {
    return (
      <div className="flex flex-col gap-2">
        <Label htmlFor={`config-${option.id}`} className="text-sm font-medium">
          {option.label}
        </Label>
        <Input
          id={`config-${option.id}`}
          type="text"
          value={controller.state.engraving}
          onChange={(e) => controller.setEngraving(e.target.value)}
          placeholder="Votre texte..."
          maxLength={ENGRAVING_MAX_LENGTH}
        />
        <p className="text-xs text-stone-500">
          La gravure sera confirmée à la commande.
        </p>
      </div>
    )
  }

  const selectedId = controller.getSelectedChoiceId(option.id)

  return (
    <div className="flex flex-col gap-2">
      <Label className="text-sm font-medium">{option.label}</Label>
      <div className="flex flex-wrap gap-2" role="radiogroup">
        {option.choices.map((choice) => {
          const isActive = choice.id === selectedId
          return (
            <button
              key={choice.id}
              type="button"
              role="radio"
              aria-checked={isActive}
              title={choice.label}
              onClick={() => {
                controller.setSelection(option.id, choice.id)
                onTextureChange(option, choice.id)
              }}
              className={clx(
                "w-12 h-12 rounded border bg-stone-100 bg-cover bg-center transition-shadow",
                isActive
                  ? "border-stone-900 ring-2 ring-stone-900 ring-offset-1"
                  : "border-stone-300 hover:border-stone-500"
              )}
              style={
                choice.texturePath
                  ? { backgroundImage: `url(${choice.texturePath})` }
                  : undefined
              }
            >
              <span className="sr-only">{choice.label}</span>
            </button>
          )
        })}
      </div>
    </div>
  )
}
