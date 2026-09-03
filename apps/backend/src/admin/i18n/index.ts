/**
 * Langue par défaut du back-office.
 *
 * Le dashboard Medusa est livré traduit (`fr` fait partie des langues fournies
 * par @medusajs/dashboard) mais retombe sur l'anglais tant qu'aucune préférence
 * n'a été enregistrée. Il n'existe pas d'option de configuration pour changer ce
 * défaut, d'où ce module.
 *
 * Il est importé par le dashboard via `virtual:medusa/i18n`, en tête de son
 * `app.tsx` : son code s'exécute donc avant l'initialisation de i18next, ce qui
 * permet de peupler la préférence à temps pour le tout premier rendu (pas de
 * bascule visible de l'anglais vers le français).
 */

/** Clé lue par le détecteur de langue du dashboard, en cookie ET en localStorage. */
const LANGUAGE_KEY = "lng"
const DEFAULT_LANGUAGE = "fr"
const ONE_YEAR_IN_SECONDS = 60 * 60 * 24 * 365

function readCookie(name: string): string | null {
  const match = document.cookie.match(new RegExp(`(?:^|;\\s*)${name}=([^;]*)`))
  return match ? decodeURIComponent(match[1]) : null
}

/**
 * Écrit « fr » comme langue courante, uniquement si l'utilisateur n'en a pas
 * déjà choisi une : le sélecteur de Réglages → Profil reste maître, et son
 * choix (l'anglais compris) n'est jamais réécrit aux chargements suivants.
 */
function seedDefaultLanguage(): void {
  try {
    // `||` et non `??` : un cookie vidé (`lng=`) ne doit pas masquer la
    // préférence encore présente en localStorage.
    const stored =
      readCookie(LANGUAGE_KEY) || window.localStorage.getItem(LANGUAGE_KEY)
    if (stored) {
      return
    }

    window.localStorage.setItem(LANGUAGE_KEY, DEFAULT_LANGUAGE)
    document.cookie = `${LANGUAGE_KEY}=${DEFAULT_LANGUAGE}; path=/; max-age=${ONE_YEAR_IN_SECONDS}; SameSite=Lax`
  } catch {
    // Navigation privée ou stockage bloqué : le dashboard ouvrira en anglais,
    // la langue reste changeable à la main. Rien de bloquant, on n'alerte pas.
  }
}

if (typeof window !== "undefined") {
  seedDefaultLanguage()
}

// Aucune traduction propre à déclarer : les extensions admin de ce projet sont
// écrites directement en français.
export default {}
