/**
 * Consentement cookies — socle de données (RGPD art. 4-11 & 7, ePrivacy /
 * art. 82 loi Informatique et Libertés, délibération CNIL n° 2020-091).
 *
 * Module ISOMORPHE volontairement : ni `server-only`, ni `next/headers`, ni
 * React. Le bandeau (client) et n'importe quelle lecture serveur future
 * partagent donc UNE seule définition des finalités — impossible d'afficher
 * une liste et d'en appliquer une autre.
 *
 * Les règles juridiques sont portées ici, pas dans l'UI :
 *
 *  - Les cookies STRICTEMENT NÉCESSAIRES (panier, session, langue) sont
 *    exemptés de consentement : ils ne sont pas une catégorie consentable et
 *    n'apparaissent donc pas dans `CONSENT_CATEGORIES` (leur description vit
 *    dans la page /cookies, à titre d'information).
 *  - Un REFUS est une valeur stockée, pas une absence de cookie : sans ça on
 *    redemanderait à chaque page à qui vient de refuser, ce que la CNIL
 *    proscrit (le refus doit être conservé aussi longtemps que l'accord).
 *  - Aucune case pré-cochée → `NO_CONSENT` est l'état par défaut.
 *  - 6 mois de durée de vie : recommandation CNIL sur la validité du choix.
 *
 * AJOUTER UNE FINALITÉ = 3 gestes : étendre `ConsentCategory`, ajouter l'entrée
 * dans `CONSENT_CATEGORIES`, INCRÉMENTER `CONSENT_VERSION` (sinon les visiteurs
 * ayant déjà répondu ne seraient jamais consultés sur la nouvelle finalité).
 */

export const CONSENT_COOKIE_NAME = "hinaso_consent"

/** Toute évolution des finalités rend les consentements passés caducs. */
export const CONSENT_VERSION = 1

/** ~6 mois, recommandation CNIL pour la durée de validité du choix. */
export const CONSENT_MAX_AGE = 60 * 60 * 24 * 182

/**
 * Événement `window` émis à chaque choix. Sert de point d'accroche aux scripts
 * tiers non-React (snippet analytics injecté à la main, Consent Mode Google…)
 * qui ne peuvent pas consommer le contexte React.
 */
export const CONSENT_CHANGE_EVENT = "hinaso:consent-change"

export type ConsentCategory = "analytics" | "marketing"

export type ConsentChoices = Record<ConsentCategory, boolean>

export type ConsentRecord = ConsentChoices & {
  v: number
  /** Date ISO du choix — preuve du consentement exigée par l'art. 7.1 RGPD. */
  date: string
}

export type ConsentCategoryInfo = {
  id: ConsentCategory
  label: string
  description: string
}

export const CONSENT_CATEGORIES: ConsentCategoryInfo[] = [
  {
    id: "analytics",
    label: "Mesure d'audience",
    description:
      "Nous aide à comprendre quelles pages sont consultées et à améliorer la boutique. Les statistiques sont agrégées et ne servent pas à vous identifier.",
  },
  {
    id: "marketing",
    label: "Publicité et réseaux sociaux",
    description:
      "Permet de vous proposer des publicités adaptées à vos centres d'intérêt et de mesurer leur efficacité, sur ce site comme sur les réseaux sociaux.",
  },
]

const buildChoices = (value: boolean): ConsentChoices =>
  CONSENT_CATEGORIES.reduce(
    (choices, category) => ({ ...choices, [category.id]: value }),
    {} as ConsentChoices
  )

/** État par défaut : rien n'est accepté tant que rien n'a été accepté. */
export const NO_CONSENT: ConsentChoices = buildChoices(false)

export const FULL_CONSENT: ConsentChoices = buildChoices(true)

/**
 * Relit un enregistrement de consentement. Retourne `null` dès qu'un doute
 * existe (cookie absent, altéré, version périmée) : en cas d'incertitude on
 * redemande, on ne suppose jamais un accord.
 */
export function parseConsent(raw: string | null | undefined): ConsentRecord | null {
  if (!raw) {
    return null
  }

  try {
    const parsed = JSON.parse(decodeURIComponent(raw)) as Partial<ConsentRecord>

    if (parsed?.v !== CONSENT_VERSION) {
      return null
    }

    const choices = CONSENT_CATEGORIES.reduce(
      // `=== true` et non un cast : une valeur exotique (null, "oui", 1) issue
      // d'un cookie bricolé à la main ne doit pas passer pour un accord.
      (acc, category) => ({ ...acc, [category.id]: parsed[category.id] === true }),
      {} as ConsentChoices
    )

    return {
      ...choices,
      v: CONSENT_VERSION,
      date: typeof parsed.date === "string" ? parsed.date : new Date().toISOString(),
    }
  } catch {
    return null
  }
}

/**
 * Lecture côté navigateur.
 *
 * Le consentement n'est JAMAIS lu pendant le rendu serveur des pages : celles-ci
 * sont majoritairement statiques (SSG/ISR) et un HTML mis en cache avec l'état
 * d'un visiteur serait resservi aux suivants. Le bandeau se décide donc après
 * l'hydratation, ce qui garantit aussi l'absence d'écart d'hydratation.
 */
export function readConsentCookie(): ConsentRecord | null {
  if (typeof document === "undefined") {
    return null
  }

  const raw = document.cookie
    .split("; ")
    .find((entry) => entry.startsWith(`${CONSENT_COOKIE_NAME}=`))
    ?.slice(CONSENT_COOKIE_NAME.length + 1)

  return parseConsent(raw)
}

/** Écrit le choix et renvoie l'enregistrement effectivement stocké. */
export function writeConsentCookie(choices: ConsentChoices): ConsentRecord {
  const record: ConsentRecord = {
    ...choices,
    v: CONSENT_VERSION,
    date: new Date().toISOString(),
  }

  const attributes = [
    `${CONSENT_COOKIE_NAME}=${encodeURIComponent(JSON.stringify(record))}`,
    "Path=/",
    `Max-Age=${CONSENT_MAX_AGE}`,
    // `Lax` et non `Strict` (contrairement aux cookies Medusa) : avec `Strict`
    // le cookie n'est pas envoyé lors d'une arrivée depuis un lien externe
    // (Google, Instagram…), et le visiteur reverrait le bandeau à chaque
    // nouvelle visite référée.
    "SameSite=Lax",
  ]

  // Conditionné au protocole RÉEL, pas à NODE_ENV : sur une preview servie en
  // HTTP, un cookie `Secure` serait ignoré en silence et le bandeau
  // réapparaîtrait à chaque page.
  if (window.location.protocol === "https:") {
    attributes.push("Secure")
  }

  document.cookie = attributes.join("; ")

  return record
}
