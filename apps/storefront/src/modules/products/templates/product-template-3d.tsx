"use client"

// ──────────────────────────────────────────────────────────────────────
// ProductTemplate3D
// Remplace le template produit standard Medusa.
// Intègre le viewer 3D + le customizer + les actions Medusa (add to cart).
//
// Usage dans src/modules/products/templates/index.tsx :
//   Remplacer <ProductTemplate> par <ProductTemplate3D>
//   ou switcher conditionnellement selon product.handle.
// ──────────────────────────────────────────────────────────────────────

import { Suspense } from "react"
import { notFound } from "next/navigation"
import { HttpTypes } from "@medusajs/types"

import { ProductViewer3D }    from "@modules/products/components/product-viewer-3d"
import { ProductCustomizer }  from "@modules/products/components/product-customizer"
import { useProductCustomization } from "@modules/products/hooks/use-product-customization"
import ProductActions          from "@modules/products/components/product-actions"
import type { ProductHandle }  from "@modules/products/components/product-viewer-3d/types"

type Props = {
  product: HttpTypes.StoreProduct
  region:  HttpTypes.StoreRegion
  countryCode: string
}

export default function ProductTemplate3D({ product, region, countryCode }: Props) {
  if (!product || !product.id) notFound()

  const {
    state,
    viewerOptions,
    cartMetadata,
    setColor,
    setDesign,
    setEngravingText,
  } = useProductCustomization()

  const handle = product.handle as ProductHandle

  return (
    <div className="content-container py-6 relative">
      <div className="flex flex-col lg:flex-row gap-8 lg:gap-12 items-start">

        {/* ── Colonne gauche : Viewer 3D ─────────────────────────── */}
        <div className="w-full lg:w-1/2 lg:sticky lg:top-20">
          <ProductViewer3D
            handle={handle}
            options={viewerOptions}
            height="540px"
          />
        </div>

        {/* ── Colonne droite : Infos + Customizer + Add to Cart ──── */}
        <div className="w-full lg:w-1/2 flex flex-col gap-8">

          {/* En-tête produit */}
          <div>
            <p className="text-xs tracking-[0.2em] uppercase text-neutral-400 mb-2">
              Kogei — Artisanat japonais
            </p>
            <h1 className="text-3xl font-medium text-neutral-900">
              {product.title}
            </h1>
            {product.description && (
              <p className="mt-4 text-neutral-500 text-sm leading-relaxed">
                {product.description}
              </p>
            )}
          </div>

          {/* ── Personnalisation ─────────────────────────────────── */}
          <div className="p-6 rounded-2xl bg-neutral-50 border border-neutral-100">
            <h2 className="text-sm font-semibold tracking-widest uppercase mb-5 text-neutral-700">
              Personnaliser
            </h2>
            <ProductCustomizer
              state={state}
              onColorChange={setColor}
              onDesignChange={setDesign}
              onEngravingChange={setEngravingText}
            />
          </div>

          {/* ── Actions Medusa (variantes de taille etc. + add to cart) */}
          {/* On passe cartMetadata pour stocker la personnalisation en BDD */}
          <Suspense fallback={<div className="h-20 bg-neutral-100 rounded-xl animate-pulse" />}>
            <ProductActions
              product={product}
              region={region}
              // @ts-expect-error — les actions Medusa acceptent des metadata custom
              metadata={cartMetadata}
            />
          </Suspense>

          {/* Résumé de la personnalisation choisie */}
          <div className="text-xs text-neutral-400 space-y-1 border-t pt-4">
            <p>
              <span className="font-medium text-neutral-600">Couleur :</span>{" "}
              {state.color.label}
            </p>
            <p>
              <span className="font-medium text-neutral-600">Design :</span>{" "}
              {state.design.label}
            </p>
            {state.engravingText && (
              <p>
                <span className="font-medium text-neutral-600">Gravure :</span>{" "}
                « {state.engravingText} »
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
