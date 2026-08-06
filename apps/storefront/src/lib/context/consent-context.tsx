"use client"

import {
  CONSENT_CHANGE_EVENT,
  ConsentCategory,
  ConsentChoices,
  ConsentRecord,
  FULL_CONSENT,
  NO_CONSENT,
  readConsentCookie,
  writeConsentCookie,
} from "@lib/util/cookie-consent"
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react"

type ConsentContextValue = {
  /** `null` = aucun choix exprimé (ou choix devenu caduc). */
  record: ConsentRecord | null
  /** Le cookie a été relu côté navigateur : avant, on n'affiche rien. */
  isLoaded: boolean
  /** Le bandeau doit être présenté (rien n'a encore été choisi). */
  needsChoice: boolean
  isPreferencesOpen: boolean
  /** Seule façon correcte de conditionner un script tiers. */
  hasConsent: (category: ConsentCategory) => boolean
  acceptAll: () => void
  rejectAll: () => void
  saveChoices: (choices: ConsentChoices) => void
  openPreferences: () => void
  closePreferences: () => void
}

const ConsentContext = createContext<ConsentContextValue | null>(null)

export const ConsentProvider = ({ children }: { children?: React.ReactNode }) => {
  const [record, setRecord] = useState<ConsentRecord | null>(null)
  const [isLoaded, setIsLoaded] = useState(false)
  const [isPreferencesOpen, setIsPreferencesOpen] = useState(false)

  // Lecture après montage uniquement : les pages sont majoritairement statiques,
  // l'état du consentement ne peut pas venir du HTML (il serait mis en cache et
  // partagé entre visiteurs). Effet de bord assumé : le bandeau apparaît juste
  // après l'hydratation plutôt que dans le HTML initial.
  useEffect(() => {
    setRecord(readConsentCookie())
    setIsLoaded(true)
  }, [])

  const commit = useCallback((choices: ConsentChoices) => {
    const next = writeConsentCookie(choices)

    setRecord(next)
    setIsPreferencesOpen(false)

    // Rediffusé sur `window` pour les scripts tiers hors arbre React (snippet
    // analytics, Consent Mode…), qui n'ont pas accès à ce contexte.
    window.dispatchEvent(
      new CustomEvent<ConsentRecord>(CONSENT_CHANGE_EVENT, { detail: next })
    )
  }, [])

  const value = useMemo<ConsentContextValue>(
    () => ({
      record,
      isLoaded,
      needsChoice: isLoaded && record === null,
      isPreferencesOpen,
      hasConsent: (category) => record?.[category] === true,
      acceptAll: () => commit(FULL_CONSENT),
      rejectAll: () => commit(NO_CONSENT),
      saveChoices: (choices) => commit(choices),
      openPreferences: () => setIsPreferencesOpen(true),
      closePreferences: () => setIsPreferencesOpen(false),
    }),
    [record, isLoaded, isPreferencesOpen, commit]
  )

  return (
    <ConsentContext.Provider value={value}>{children}</ConsentContext.Provider>
  )
}

export const useConsent = () => {
  const context = useContext(ConsentContext)

  if (context === null) {
    throw new Error("useConsent must be used within a ConsentProvider")
  }

  return context
}
