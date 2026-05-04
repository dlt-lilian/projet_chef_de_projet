"use client"

// ──────────────────────────────────────────────────────────────────────
// <ProductCustomizer />
// Panel de personnalisation : couleur · design · gravure
// S'intègre en remplacement (ou à côté) du sélecteur de variantes Medusa.
// ──────────────────────────────────────────────────────────────────────

import { COLOR_OPTIONS, DESIGN_OPTIONS } from "@lib/constants/kogei-customization"
import type { ColorOption, CustomizationState, DesignOption } from "@modules/products/components/product-viewer-3d/types"

type Props = {
  state: CustomizationState
  onColorChange:   (c: ColorOption)  => void
  onDesignChange:  (d: DesignOption) => void
  onEngravingChange: (text: string)  => void
}

// ── Sous-composants ─────────────────────────────────────────────────

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-xs font-medium tracking-[0.15em] uppercase text-neutral-500 mb-3">
      {children}
    </p>
  )
}

function ColorPicker({ selected, onChange }: {
  selected: ColorOption
  onChange: (c: ColorOption) => void
}) {
  return (
    <div>
      <SectionTitle>
        Couleur — <span className="normal-case font-normal">{selected.label}</span>
      </SectionTitle>
      <div className="flex gap-2 flex-wrap">
        {COLOR_OPTIONS.map((color) => (
          <button
            key={color.id}
            title={color.label}
            onClick={() => onChange(color)}
            className={[
              "w-8 h-8 rounded-full border-2 transition-transform",
              selected.id === color.id
                ? "border-neutral-800 scale-110 shadow-md"
                : "border-transparent hover:scale-105",
            ].join(" ")}
            style={{ backgroundColor: color.hex }}
            aria-label={color.label}
            aria-pressed={selected.id === color.id}
          />
        ))}
      </div>
    </div>
  )
}

function DesignPicker({ selected, onChange }: {
  selected: DesignOption
  onChange: (d: DesignOption) => void
}) {
  return (
    <div>
      <SectionTitle>
        Design — <span className="normal-case font-normal">{selected.label}</span>
      </SectionTitle>
      <div className="flex gap-2 flex-wrap">
        {DESIGN_OPTIONS.map((design) => (
          <button
            key={design.id}
            title={design.label}
            onClick={() => onChange(design)}
            className={[
              "relative flex flex-col items-center gap-1 px-3 py-2 rounded-xl border transition-all text-xs",
              selected.id === design.id
                ? "border-neutral-800 bg-neutral-50 shadow-sm font-semibold"
                : "border-neutral-200 hover:border-neutral-400 text-neutral-500",
            ].join(" ")}
            aria-pressed={selected.id === design.id}
          >
            {/* Pastille couleur preview */}
            <span
              className="w-5 h-5 rounded-full border border-neutral-200"
              style={{ backgroundColor: design.preview }}
            />
            {design.label}
          </button>
        ))}
      </div>
    </div>
  )
}

function EngravingInput({ value, onChange }: {
  value: string
  onChange: (text: string) => void
}) {
  return (
    <div>
      <SectionTitle>
        Gravure personnalisée{" "}
        <span className="normal-case font-normal text-neutral-400">
          ({value.length}/30)
        </span>
      </SectionTitle>
      <div className="relative">
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          maxLength={30}
          placeholder="Votre texte gravé…"
          className={[
            "w-full px-4 py-3 rounded-xl border bg-white text-sm",
            "placeholder:text-neutral-300 focus:outline-none",
            "border-neutral-200 focus:border-neutral-800 transition-colors",
          ].join(" ")}
        />
        {value && (
          <button
            onClick={() => onChange("")}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-700 text-lg leading-none"
            aria-label="Effacer la gravure"
          >
            ×
          </button>
        )}
      </div>
      <p className="mt-1.5 text-[11px] text-neutral-400">
        Aparaîtra sur votre produit. Laissez vide pour aucune gravure.
      </p>
    </div>
  )
}

// ── Composant principal ──────────────────────────────────────────────

export function ProductCustomizer({ state, onColorChange, onDesignChange, onEngravingChange }: Props) {
  return (
    <div className="flex flex-col gap-6">
      <ColorPicker
        selected={state.color}
        onChange={onColorChange}
      />
      <DesignPicker
        selected={state.design}
        onChange={onDesignChange}
      />
      <EngravingInput
        value={state.engravingText}
        onChange={onEngravingChange}
      />
    </div>
  )
}
