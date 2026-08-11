/**
 * Balises Google (GTM / GA4) — mécanique bas niveau, aucun React ici.
 *
 * Le gating retenu est le plus strict des deux possibles : tant qu'aucune
 * finalité n'est acceptée, la balise n'est PAS insérée dans la page — aucune
 * requête n'atteint Google, pas même un ping « cookieless ». Le Consent Mode
 * est branché EN PLUS, jamais à la place : il porte le détail par finalité
 * (mesure d'audience acceptée mais pas la publicité, par exemple), couvre le
 * retrait, et reste correct si quelqu'un desserre un jour la condition de
 * montage.
 *
 * GA4 tronque les adresses IP par défaut (aucun réglage à activer) et rien ne
 * se déclenche avant un consentement explicite : ce sont les deux premiers
 * points que la CNIL vérifie sur cet outil.
 */

declare global {
  interface Window {
    dataLayer?: unknown[]
    gtag?: (...args: unknown[]) => void
  }
}

// Accès littéraux obligatoires : Next remplace `process.env.NEXT_PUBLIC_X` au
// build par analyse statique. Un accès indirect (`process.env[clé]`) n'est pas
// substitué et vaudrait `undefined` dans le bundle navigateur.

/** Conteneur Google Tag Manager (`GTM-XXXXXXX`). */
export const GTM_CONTAINER_ID = (process.env.NEXT_PUBLIC_GTM_ID ?? "").trim()

/** Propriété GA4 en direct, sans GTM (`G-XXXXXXXXXX`). */
export const GA_MEASUREMENT_ID = (
  process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID ?? ""
).trim()

/**
 * Les deux modes s'excluent : GTM déploie déjà sa propre balise GA4, charger
 * gtag.js en plus dupliquerait chaque hit. Le conteneur l'emporte.
 */
export const USE_GTM = Boolean(GTM_CONTAINER_ID)
export const USE_GA_DIRECT = !USE_GTM && Boolean(GA_MEASUREMENT_ID)

type ConsentSignal = "granted" | "denied"

export type GoogleConsentSignals = {
  analytics_storage: ConsentSignal
  ad_storage: ConsentSignal
  ad_user_data: ConsentSignal
  ad_personalization: ConsentSignal
}

const signal = (granted: boolean): ConsentSignal =>
  granted ? "granted" : "denied"

/**
 * Traduit NOS finalités en signaux Consent Mode.
 *
 * Les signaux publicitaires suivent la finalité « marketing » et non
 * « analytics » : accepter la mesure d'audience ne doit pas ouvrir les
 * fonctions Google Signals / remarketing, qui relèvent de la publicité.
 */
export const googleConsentSignals = (
  analytics: boolean,
  marketing: boolean
): GoogleConsentSignals => ({
  analytics_storage: signal(analytics),
  ad_storage: signal(marketing),
  ad_user_data: signal(marketing),
  ad_personalization: signal(marketing),
})

/** État initial : tout est refusé tant que l'utilisateur n'a pas dit l'inverse. */
export const GOOGLE_CONSENT_DEFAULTS = {
  ...googleConsentSignals(false, false),
  // Non couverts par notre bandeau car relevant du fonctionnement du site
  // lui-même (cookies strictement nécessaires, exemptés de consentement).
  functionality_storage: "granted",
  security_storage: "granted",
} as const

const ANALYTICS_COOKIES = /^_ga|^_gid$|^_gat/
const ADVERTISING_COOKIES = /^_gcl/

/**
 * Efface les cookies déjà déposés par les balises Google.
 *
 * Indispensable au retrait du consentement : démonter la balise retire le
 * `<script>` du DOM, mais le code déjà exécuté reste en mémoire ET les cookies
 * survivent (13 mois pour `_ga`). Sans cette purge, « je retire mon
 * consentement » ne supprimerait rien du poste de l'utilisateur.
 *
 * Google pose ses cookies sur le domaine ENREGISTRABLE avec un point en tête
 * (`.hinaso.fr`) : un effacement sur le seul hôte courant échouerait
 * silencieusement, d'où le balayage de chaque domaine parent.
 */
function clearCookies(pattern: RegExp): void {
  if (typeof document === "undefined") {
    return
  }

  const names = document.cookie
    .split("; ")
    .map((entry) => entry.split("=")[0])
    .filter((name) => pattern.test(name))

  if (names.length === 0) {
    return
  }

  const hostParts = window.location.hostname.split(".")
  const domains = [""]

  for (let i = 0; i < hostParts.length - 1; i++) {
    const domain = hostParts.slice(i).join(".")
    domains.push(`; domain=${domain}`, `; domain=.${domain}`)
  }

  for (const name of names) {
    for (const domain of domains) {
      document.cookie = `${name}=; Max-Age=0; path=/${domain}`
    }
  }
}

export const clearAnalyticsCookies = () => clearCookies(ANALYTICS_COOKIES)

export const clearAdvertisingCookies = () => clearCookies(ADVERTISING_COOKIES)

/**
 * Empile une commande gtag, sans effet tant que la balise n'a pas défini
 * `window.gtag`.
 *
 * Volontairement sans repli « push direct dans `dataLayer` » : gtag.js n'y
 * relit que des objets `arguments`, pas des tableaux, et une entrée malformée
 * corromprait la file. Les seuls appels concernés (changement de préférences)
 * surviennent de toute façon après un geste utilisateur, donc bien après le
 * chargement de la balise.
 */
export function gtagPush(...args: unknown[]): void {
  if (typeof window === "undefined") {
    return
  }

  window.gtag?.(...args)
}

/**
 * Préambule commun aux deux modes, injecté AVANT le chargement de la balise :
 * `dataLayer` + stub `gtag` + état de consentement. L'ordre est impératif —
 * Google précise que le `consent default` doit être traité avant toute autre
 * commande, sans quoi des balises peuvent partir avant d'être filtrées.
 */
export function consentBootstrapScript(
  analytics: boolean,
  marketing: boolean
): string {
  return `window.dataLayer = window.dataLayer || [];
function gtag(){dataLayer.push(arguments);}
window.gtag = gtag;
gtag('consent', 'default', ${JSON.stringify(GOOGLE_CONSENT_DEFAULTS)});
gtag('consent', 'update', ${JSON.stringify(
    googleConsentSignals(analytics, marketing)
  )});`
}
