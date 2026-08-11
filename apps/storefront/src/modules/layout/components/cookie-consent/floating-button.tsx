"use client"

import { useConsent } from "@lib/context/consent-context"
import { Icon } from "@modules/common/components/my_ui"

export default function CookiePreferencesButton() {
  const { openPreferences } = useConsent()

  return (
    <button
      type="button"
      onClick={openPreferences}
      aria-label="Gestion des cookies"
      title="Gestion des cookies"
      className="fixed bottom-5 left-5 z-[940] flex h-10 w-10 items-center justify-center rounded-circle border border-grey-20 bg-white text-grey-70 shadow-[var(--shadow-card)] transition-colors hover:text-primary focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
    >
      <Icon name="cookie" size={18} /> Gestion des cookies
    </button>
  )
}
