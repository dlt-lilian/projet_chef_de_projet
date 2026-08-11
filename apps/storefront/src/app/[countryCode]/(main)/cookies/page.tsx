import CookiePreferencesLink from "@modules/layout/components/cookie-consent/preferences-link"
import { Metadata } from "next"

/**
 * Politique cookies — information préalable exigée avant tout dépôt
 * (art. 13 RGPD + délibération CNIL n° 2020-091).
 *
 * ⚠️ Ce tableau doit refléter les cookies RÉELLEMENT déposés. À mettre à jour
 * en même temps que `CONSENT_CATEGORIES` (lib/util/cookie-consent.ts) dès
 * qu'un traceur est ajouté — et penser à incrémenter `CONSENT_VERSION` pour
 * que les visiteurs déjà consultés le soient de nouveau.
 *
 * Contrairement aux autres pages légales encore vides, celle-ci est rédigée →
 * indexable (pas de `robots.index:false`).
 */
export const metadata: Metadata = {
  title: "Gestion des cookies",
  description:
    "Liste des cookies déposés sur le site Hinaso, leur finalité, leur durée de conservation et la façon de modifier votre consentement.",
}

type CookieRow = {
  name: string
  purpose: string
  duration: string
}

const analyticsCookies: CookieRow[] = [
  {
    name: "_ga",
    purpose:
      "Déposé par Google Analytics pour distinguer les visiteurs les uns des autres.",
    duration: "13 mois",
  },
  {
    name: "_ga_<ID>",
    purpose:
      "Déposé par Google Analytics pour conserver l'état de la session de mesure.",
    duration: "13 mois",
  },
]

const necessaryCookies: CookieRow[] = [
  {
    name: "_medusa_cart_id",
    purpose: "Retient votre panier d'une page à l'autre.",
    duration: "7 jours",
  },
  {
    name: "_medusa_jwt",
    purpose: "Vous maintient connecté à votre compte client.",
    duration: "7 jours",
  },
  {
    name: "_medusa_cache_id",
    purpose:
      "Identifiant technique permettant de servir les bonnes données de boutique (régions, catalogue).",
    duration: "24 heures",
  },
  {
    name: "_medusa_locale",
    purpose: "Mémorise la langue que vous avez sélectionnée.",
    duration: "1 an",
  },
  {
    name: "hinaso_consent",
    purpose:
      "Conserve votre choix en matière de cookies, pour ne pas vous le redemander à chaque page.",
    duration: "6 mois",
  },
  {
    name: "__stripe_mid, __stripe_sid",
    purpose:
      "Déposés par Stripe, notre prestataire de paiement, uniquement lors du règlement, afin de sécuriser la transaction et de prévenir la fraude.",
    duration: "1 an / 30 minutes",
  },
]

function CookieTable({ rows }: { rows: CookieRow[] }) {
  return (
    <div className="mt-4 overflow-x-auto">
      <table className="w-full min-w-[560px] border-collapse text-left text-sm">
        <thead>
          <tr className="border-b border-grey-20 text-grey-90">
            <th scope="col" className="py-2 pr-4 font-semibold">
              Nom
            </th>
            <th scope="col" className="py-2 pr-4 font-semibold">
              Finalité
            </th>
            <th scope="col" className="py-2 font-semibold">
              Durée
            </th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.name} className="border-b border-grey-20 align-top">
              <td className="py-3 pr-4 font-medium text-grey-90">{row.name}</td>
              <td className="py-3 pr-4 leading-relaxed text-grey-70">
                {row.purpose}
              </td>
              <td className="py-3 whitespace-nowrap text-grey-70">
                {row.duration}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export default function CookiesPage() {
  return (
    <div className="content-container py-10 md:py-14">
      <p className="text-xs text-gray-500 mb-2">Accueil / Gestion des cookies</p>
      <h1 className="text-2xl md:text-3xl font-semibold mb-6 text-grey-90">
        Gestion des cookies
      </h1>

      <div className="max-w-[820px]">
        <p className="leading-relaxed text-grey-70">
          Un cookie est un petit fichier déposé sur votre appareil lorsque vous
          consultez un site. Certains sont indispensables pour que la boutique
          fonctionne&nbsp;; les autres ne sont déposés qu&apos;après votre
          accord, et vous pouvez revenir sur cet accord à tout moment.
        </p>

        <div className="mt-8 rounded-large border border-grey-20 bg-grey-5 p-5">
          <p className="text-sm font-semibold text-grey-90">
            Modifier mon choix
          </p>
          <p className="mt-1 text-sm leading-relaxed text-grey-70">
            Vous pouvez accepter, refuser ou ajuster finalité par finalité, aussi
            souvent que vous le souhaitez.
          </p>
          <CookiePreferencesLink className="mt-4 inline-flex h-11 items-center rounded-xl border border-primary bg-primary px-6 text-sm font-semibold text-white transition-colors hover:bg-primary-light focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2" />
        </div>

        <h2 className="mt-10 text-xl font-semibold text-grey-90">
          Cookies strictement nécessaires
        </h2>
        <p className="mt-2 leading-relaxed text-grey-70">
          Ils permettent au site de fonctionner&nbsp;: garder votre panier, vous
          reconnaître lorsque vous êtes connecté, sécuriser le paiement. Ils ne
          servent à aucun suivi publicitaire et sont, à ce titre, dispensés de
          consentement&nbsp;; les désactiver rendrait la commande impossible.
        </p>
        <CookieTable rows={necessaryCookies} />

        <h2 className="mt-10 text-xl font-semibold text-grey-90">
          Mesure d&apos;audience
        </h2>
        <p className="mt-2 leading-relaxed text-grey-70">
          Nous utilisons <strong className="font-semibold">Google Analytics</strong>{" "}
          pour savoir quelles pages sont consultées et améliorer la boutique.
          Ces cookies ne sont déposés qu&apos;après votre accord&nbsp;: tant que
          vous n&apos;avez pas accepté cette finalité, le script de Google
          n&apos;est pas chargé et aucune donnée ne lui est transmise. Si vous
          retirez votre accord, la mesure s&apos;arrête et les cookies ci-dessous
          sont supprimés.
        </p>
        <p className="mt-2 leading-relaxed text-grey-70">
          Destinataire&nbsp;: Google Ireland Limited. Les données peuvent être
          transférées aux États-Unis dans le cadre du Data Privacy Framework.
          Les adresses IP sont tronquées par Google avant enregistrement.
        </p>
        <CookieTable rows={analyticsCookies} />

        <h2 className="mt-10 text-xl font-semibold text-grey-90">Publicité</h2>
        <p className="mt-2 leading-relaxed text-grey-70">
          Aucun cookie publicitaire n&apos;est déposé sur ce site à ce jour. Si
          nous en ajoutons, ils seront listés ici et ne seront activés
          qu&apos;après votre accord explicite&nbsp;; votre choix précédent vous
          sera alors redemandé.
        </p>

        <h2 className="mt-10 text-xl font-semibold text-grey-90">
          Durée de votre choix
        </h2>
        <p className="mt-2 leading-relaxed text-grey-70">
          Votre décision — accord comme refus — est conservée 6 mois,
          conformément à la recommandation de la CNIL. Passé ce délai, la
          question vous sera de nouveau posée. Vous pouvez également supprimer
          les cookies depuis les réglages de votre navigateur, ce qui effacera
          votre choix.
        </p>
      </div>
    </div>
  )
}
