"use client"

import { addToCart } from "@lib/data/cart"
import { HttpTypes } from "@medusajs/types"
import { Button, clx, Input, Label } from "@modules/common/components/ui"
import { Icon } from "@modules/common/components/my_ui"
import ProductPrice from "@modules/products/components/product-price"
import * as AccordionPrimitive from "@radix-ui/react-accordion"
import { useParams } from "next/navigation"
import { useState } from "react"
import {
  ConfiguratorOption,
  ConfiguratorProductConfig,
} from "../config/configurableProducts"
import { UseProductConfiguratorReturn } from "../hooks/useProductConfigurator"

type ProductVariant = NonNullable<HttpTypes.StoreProduct["variants"]>[number]

type ConfiguratorSidebarProps = {
  product: HttpTypes.StoreProduct
  config: ConfiguratorProductConfig
  controller: UseProductConfiguratorReturn
  onOptionChange: (option: ConfiguratorOption, choiceId: string) => void
  /** Menu mobile ouvert (id d'option) ou null si replié — pilote le zoom 3D. */
  onActiveOptionChange?: (optionId: string | null) => void
}

const ENGRAVING_MAX_LENGTH = 30

/** Icône thématique par type d'option (en-têtes des menus déroulants mobile). */
function iconForOption(option: ConfiguratorOption): string {
  switch (option.type) {
    case "color":
      return "palette"
    case "texture":
      return "layers"
    case "motif":
      return "sparkles"
    case "engraving":
      return "pen-line"
    default:
      return "settings-2"
  }
}

/** Libellé de la sélection courante, affiché sous le titre dans l'accordéon. */
function selectedChoiceLabel(
  option: ConfiguratorOption,
  controller: UseProductConfiguratorReturn
): string {
  if (option.type === "engraving") {
    return controller.state.engraving?.trim() || "Aucune"
  }
  const id = controller.getSelectedChoiceId(option.id)
  return option.choices.find((c) => c.id === id)?.label ?? "—"
}

export default function ConfiguratorSidebar({
  product,
  config,
  controller,
  onOptionChange,
  onActiveOptionChange,
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
    <>
      {/* ───────────── DESKTOP : sidebar classique (≥ md) ───────────── */}
      <aside className="hidden md:flex flex-col gap-6 w-full md:w-[40%] md:max-w-[420px] md:min-w-[320px] p-6 md:border-l border-stone-200 bg-white">
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
              onOptionChange={onOptionChange}
            />
          ))}
        </div>

        <div className="mt-auto flex flex-col gap-3 pt-6 border-t border-stone-200">
          <ConfiguratorActions
            product={product}
            variant={variant}
            isAdding={isAdding}
            onAddToCart={handleAddToCart}
          />
        </div>
      </aside>

      {/* ───────────── MOBILE : bottom sheet collé en bas (< md) ─────────────
          Le visualiseur 3D occupe le haut ; ce panneau reste en bas de l'écran.
          Chaque option est un menu déroulant (icône + chevron) ; le bouton
          d'ajout au panier reste toujours visible sous la liste. */}
      <div className="md:hidden flex min-h-0 max-h-[60%] flex-none flex-col border-t border-stone-200 bg-white shadow-[0_-4px_16px_rgba(0,0,0,0.06)]">
        <AccordionPrimitive.Root
          type="single"
          collapsible
          onValueChange={(value) => onActiveOptionChange?.(value || null)}
          className="min-h-0 flex-1 divide-y divide-stone-200 overflow-y-auto overscroll-contain"
        >
          {config.options.map((option) => (
            <AccordionPrimitive.Item
              key={option.id}
              value={option.id}
              className="group"
            >
              <AccordionPrimitive.Header>
                <AccordionPrimitive.Trigger className="flex w-full items-center gap-3 px-4 py-3 text-left focus:outline-none focus-visible:bg-stone-50">
                  <Icon
                    name={iconForOption(option)}
                    size={20}
                    className="shrink-0 text-stone-700"
                  />
                  <span className="min-w-0 flex-1">
                    <span className="block text-sm font-medium text-stone-900">
                      {option.label}
                    </span>
                    <span className="block truncate text-xs text-stone-500">
                      {selectedChoiceLabel(option, controller)}
                    </span>
                  </span>
                  <Icon
                    name="chevron-down"
                    size={18}
                    className="shrink-0 text-stone-400 transition-transform duration-200 group-radix-state-open:rotate-180"
                  />
                </AccordionPrimitive.Trigger>
              </AccordionPrimitive.Header>
              <AccordionPrimitive.Content className="overflow-hidden radix-state-closed:animate-accordion-close radix-state-open:animate-accordion-open">
                <div className="px-4 pb-4 pt-1">
                  <OptionControl
                    option={option}
                    controller={controller}
                    onOptionChange={onOptionChange}
                    inputId={`config-m-${option.id}`}
                  />
                </div>
              </AccordionPrimitive.Content>
            </AccordionPrimitive.Item>
          ))}
        </AccordionPrimitive.Root>

        <div className="flex flex-none flex-col gap-2 border-t border-stone-200 bg-white p-4">
          <ConfiguratorActions
            product={product}
            variant={variant}
            isAdding={isAdding}
            onAddToCart={handleAddToCart}
          />
        </div>
      </div>
    </>
  )
}

/* ─────────────────────────── Sous-composants ─────────────────────────── */

type ConfiguratorActionsProps = {
  product: HttpTypes.StoreProduct
  variant: ProductVariant | undefined
  isAdding: boolean
  onAddToCart: () => void
}

/** Prix + bouton d'ajout au panier (partagé desktop / mobile). */
function ConfiguratorActions({
  product,
  variant,
  isAdding,
  onAddToCart,
}: ConfiguratorActionsProps) {
  return (
    <>
      <ProductPrice product={product} variant={variant} />
      <Button
        onClick={onAddToCart}
        disabled={!variant || isAdding}
        isLoading={isAdding}
        variant="primary"
        className="h-11 w-full"
        data-testid="configurator-add-to-cart"
      >
        Ajouter au panier
      </Button>
    </>
  )
}

type OptionControlProps = {
  option: ConfiguratorOption
  controller: UseProductConfiguratorReturn
  onOptionChange: (option: ConfiguratorOption, choiceId: string) => void
  /** Id de l'input de gravure ; unique par contexte (desktop vs mobile) pour
      éviter un id HTML dupliqué quand les deux rendus coexistent dans le DOM. */
  inputId?: string
}

/** Ligne d'option desktop : libellé + contrôle. */
function OptionRow(props: OptionControlProps) {
  const { option } = props
  const inputId = `config-${option.id}`
  return (
    <div className="flex flex-col gap-2">
      <Label
        htmlFor={option.type === "engraving" ? inputId : undefined}
        className="text-sm font-medium"
      >
        {option.label}
      </Label>
      <OptionControl {...props} inputId={inputId} />
    </div>
  )
}

/** Contrôle d'une option, sans libellé : input de gravure ou nuancier de choix.
    Partagé entre la sidebar desktop et l'accordéon mobile. */
function OptionControl({
  option,
  controller,
  onOptionChange,
  inputId,
}: OptionControlProps) {
  if (option.type === "engraving") {
    return (
      <div className="flex flex-col gap-2">
        <Input
          id={inputId}
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
    <div
      className="flex flex-wrap gap-2"
      role="radiogroup"
      aria-label={option.label}
    >
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
              onOptionChange(option, choice.id)
            }}
            className={clx(
              "h-12 w-12 rounded border bg-stone-100 bg-cover bg-center transition-shadow",
              isActive
                ? "border-stone-900 ring-2 ring-stone-900 ring-offset-1"
                : "border-stone-300 hover:border-stone-500"
            )}
            style={
              choice.colorHex
                ? { backgroundColor: choice.colorHex }
                : choice.texturePath
                  ? {
                      // Aperçu : bois éventuellement assombri par un calque noir.
                      backgroundImage: choice.darken
                        ? `linear-gradient(rgba(0,0,0,${choice.darken}),rgba(0,0,0,${choice.darken})),url(${choice.texturePath})`
                        : `url(${choice.texturePath})`,
                    }
                  : undefined
            }
          >
            <span className="sr-only">{choice.label}</span>
          </button>
        )
      })}
    </div>
  )
}
