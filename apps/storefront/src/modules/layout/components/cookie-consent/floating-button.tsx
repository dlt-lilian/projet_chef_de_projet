"use client"

import { useConsent } from "@lib/context/consent-context"
import { Icon } from "@modules/common/components/my_ui"

export default function CookiePreferencesButton() {
  const { openPreferences } = useConsent()

  // Pastille ronde figée (`h-10 w-10`) sur mobile, pilule qui s'ajuste au texte
  // à partir de `small` (1024 px) via `w-auto` + padding horizontal.
  // `rounded-circle` (9999 px) produit les deux formes sans bascule de rayon.
  //
  // `aria-label` est conservé alors que le texte devient visible : il double le
  // libellé sans le contredire, et reste la SEULE étiquette sur mobile.
  return (
    <button
      type="button"
      onClick={openPreferences}
      aria-label="Gestion des cookies"
      title="Gestion des cookies"
      className="fixed bottom-5 left-5 z-[940] flex h-10 w-10 items-center justify-center gap-2 rounded-circle border border-grey-20 bg-white text-sm font-medium text-grey-70 shadow-[var(--shadow-card)] transition-colors hover:text-primary focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 small:w-auto small:px-4"
    >
      <Icon name="cookie" size={18} className="shrink-0" />
      {/* `hidden` et non une simple couleur transparente : le texte doit sortir
          du flux pour que la pastille reste ronde sur mobile. */}
      <span className="hidden small:inline">Gestion des cookies</span>
    </button>
  )
}
