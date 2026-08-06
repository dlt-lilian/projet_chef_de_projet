"use client"

import { useConsent } from "@lib/context/consent-context"
import {
  CONSENT_CATEGORIES,
  ConsentCategory,
  ConsentChoices,
} from "@lib/util/cookie-consent"
import { XMark } from "@medusajs/icons"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import clsx from "clsx"
import { useEffect, useRef, useState } from "react"

const FOCUSABLE =
  'button:not([disabled]), a[href], input:not([disabled]), [tabindex]:not([tabindex="-1"])'

function ConsentSwitch({
  checked,
  disabled,
  labelledBy,
  onChange,
}: {
  checked: boolean
  disabled?: boolean
  labelledBy: string
  onChange: (next: boolean) => void
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-labelledby={labelledBy}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={clsx(
        "relative inline-flex h-6 w-11 shrink-0 items-center rounded-circle transition-colors",
        "focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2",
        checked ? "bg-primary" : "bg-grey-30",
        disabled && "opacity-60 cursor-not-allowed"
      )}
    >
      <span
        className={clsx(
          "inline-block h-4 w-4 transform rounded-circle bg-white transition-transform",
          checked ? "translate-x-6" : "translate-x-1"
        )}
      />
    </button>
  )
}

/**
 * Réglage fin des finalités. Monté uniquement quand il est ouvert : chaque
 * ouverture repart donc de l'état RÉELLEMENT enregistré, jamais d'un brouillon
 * laissé par une session précédente.
 */
export default function CookiePreferencesDialog() {
  const { record, saveChoices, closePreferences } = useConsent()
  const panelRef = useRef<HTMLDivElement>(null)

  const [choices, setChoices] = useState<ConsentChoices>(() =>
    CONSENT_CATEGORIES.reduce(
      (acc, category) => ({ ...acc, [category.id]: record?.[category.id] === true }),
      {} as ConsentChoices
    )
  )

  const toggle = (category: ConsentCategory, next: boolean) =>
    setChoices((current) => ({ ...current, [category]: next }))

  const setAll = (value: boolean) =>
    saveChoices(
      CONSENT_CATEGORIES.reduce(
        (acc, category) => ({ ...acc, [category.id]: value }),
        {} as ConsentChoices
      )
    )

  // Piège au clavier + Échap + verrou de défilement. Écrit à la main plutôt
  // qu'avec le Dialog Headless UI du projet : celui-ci ferme au clic sur le
  // fond, ce qui laisserait sortir SANS choix exprimé.
  useEffect(() => {
    const panel = panelRef.current

    if (!panel) {
      return
    }

    const previouslyFocused = document.activeElement as HTMLElement | null
    const focusables = () =>
      Array.from(panel.querySelectorAll<HTMLElement>(FOCUSABLE))

    focusables()[0]?.focus()

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        closePreferences()
        return
      }

      if (event.key !== "Tab") {
        return
      }

      const items = focusables()

      if (items.length === 0) {
        return
      }

      const first = items[0]
      const last = items[items.length - 1]

      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault()
        last.focus()
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault()
        first.focus()
      }
    }

    const previousOverflow = document.body.style.overflow

    document.addEventListener("keydown", onKeyDown)
    document.body.style.overflow = "hidden"

    return () => {
      document.removeEventListener("keydown", onKeyDown)
      document.body.style.overflow = previousOverflow
      previouslyFocused?.focus()
    }
  }, [closePreferences])

  return (
    <div className="fixed inset-0 z-[960] flex items-end justify-center sm:items-center">
      {/* Fond inerte : refermer par ce voile équivaudrait à une sortie sans
          choix, que la CNIL interdit d'interpréter comme un accord. */}
      <div className="absolute inset-0 bg-black/40" aria-hidden="true" />

      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="cookie-preferences-title"
        className="relative flex max-h-[90vh] w-full max-w-[560px] flex-col overflow-hidden rounded-t-large bg-white shadow-[var(--shadow-card)] sm:rounded-large"
      >
        {/* `shrink-0` sur l'en-tête et le pied : seule la zone centrale
            (`flex-1 overflow-y-auto`) doit se comprimer quand le panneau
            atteint `max-h`, sinon les boutons d'action sont écrasés. */}
        <div className="flex shrink-0 items-start justify-between gap-4 border-b border-grey-20 px-6 py-5">
          <h2
            id="cookie-preferences-title"
            className="text-lg font-semibold text-grey-90"
          >
            Vos préférences de cookies
          </h2>
          <button
            type="button"
            onClick={closePreferences}
            aria-label="Fermer sans modifier mes préférences"
            className="rounded-rounded p-1 text-grey-50 transition-colors hover:text-grey-90 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
          >
            <XMark />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-5">
          <p className="text-sm leading-relaxed text-grey-70">
            Vous choisissez finalité par finalité. Votre décision est conservée
            6 mois et reste modifiable à tout moment depuis le lien «&nbsp;Gestion
            des cookies&nbsp;» en bas de page.
          </p>

          <ul className="mt-6 flex flex-col gap-5">
            <li className="flex items-start justify-between gap-4">
              <div>
                <p
                  id="cookie-category-necessary"
                  className="text-sm font-semibold text-grey-90"
                >
                  Cookies strictement nécessaires
                </p>
                <p className="mt-1 text-sm leading-relaxed text-grey-70">
                  Indispensables au fonctionnement du site : panier, connexion à
                  votre compte, langue et paiement sécurisé. Sans eux, la
                  commande est impossible.
                </p>
                <p className="mt-1 text-xs font-medium text-grey-50">
                  Toujours actifs
                </p>
              </div>
              {/* Exemptés de consentement (art. 82 loi Informatique et
                  Libertés) : affichés pour information, non désactivables. */}
              <ConsentSwitch
                checked
                disabled
                labelledBy="cookie-category-necessary"
                onChange={() => {}}
              />
            </li>

            {CONSENT_CATEGORIES.map((category) => (
              <li
                key={category.id}
                className="flex items-start justify-between gap-4 border-t border-grey-20 pt-5"
              >
                <div>
                  <p
                    id={`cookie-category-${category.id}`}
                    className="text-sm font-semibold text-grey-90"
                  >
                    {category.label}
                  </p>
                  <p className="mt-1 text-sm leading-relaxed text-grey-70">
                    {category.description}
                  </p>
                </div>
                <ConsentSwitch
                  checked={choices[category.id]}
                  labelledBy={`cookie-category-${category.id}`}
                  onChange={(next) => toggle(category.id, next)}
                />
              </li>
            ))}
          </ul>

          <LocalizedClientLink
            href="/cookies"
            className="mt-6 inline-block text-sm text-grey-70 underline underline-offset-2 transition-colors hover:text-primary"
          >
            Consulter la liste détaillée des cookies
          </LocalizedClientLink>
        </div>

        <div className="shrink-0 border-t border-grey-20 px-6 py-4">
          {/* Les deux RACCOURCIS de consentement partagent le même style : ni
              l'acceptation ni le refus ne doit être mis en avant. Le bouton
              plein n'est pas un raccourci mais l'action propre du panneau
              (valider les curseurs) — il n'oriente donc pas le choix. */}
          <div className="flex flex-col gap-2 xsmall:flex-row">
            {/* `xsmall:flex-1` et non `flex-1` : en colonne (mobile) un
                flex-basis nul écraserait la hauteur `h-11` des boutons. */}
            <button
              type="button"
              onClick={() => setAll(false)}
              className="h-11 w-full rounded-xl border border-primary bg-white px-4 text-sm font-semibold text-primary transition-colors hover:bg-grey-10 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 xsmall:flex-1"
            >
              Tout refuser
            </button>
            <button
              type="button"
              onClick={() => setAll(true)}
              className="h-11 w-full rounded-xl border border-primary bg-white px-4 text-sm font-semibold text-primary transition-colors hover:bg-grey-10 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 xsmall:flex-1"
            >
              Tout accepter
            </button>
          </div>
          <button
            type="button"
            onClick={() => saveChoices(choices)}
            className="mt-2 h-11 w-full rounded-xl border border-primary bg-primary px-4 text-sm font-semibold text-white transition-colors hover:bg-primary-light focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
          >
            Enregistrer mes choix
          </button>
        </div>
      </div>
    </div>
  )
}
