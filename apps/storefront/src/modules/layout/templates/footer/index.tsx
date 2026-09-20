import LocalizedClientLink from "@modules/common/components/localized-client-link"
import { Icon } from "@modules/common/components/my_ui/icon"
import CookiePreferencesLink from "@modules/layout/components/cookie-consent/preferences-link"

/**
 * Le pied de page pointe sur les FICHES, comme la navbar.
 *
 * IL POINTAIT SUR LES CATÉGORIES jusqu'au 2026-09-08. L'idée était de leur
 * donner le maillage nécessaire pour se positionner sur des requêtes larges.
 * Deux raisons l'ont fait abandonner :
 *
 * 1. Trois ancres quasi exactes répétées sur CHAQUE page du site, c'est le
 *    signal de sur-optimisation le plus facile à détecter — le commentaire
 *    précédent s'en méfiait déjà, sans en tirer la conséquence.
 * 2. Ces liens envoyaient le jus vers des listings d'UNE référence, donc un
 *    clic de plus que la fiche qu'ils listaient.
 *
 * Le contenu qui justifiait ces pages (comparer, expliquer, répondre) est
 * parti au blog, où il se maille avec les articles existants — cf.
 * `lib/content/categories.ts`. Les catégories, elles, restent servies en
 * `noindex, follow` pour le fil d'Ariane des fiches.
 *
 * Les ancres restent volontairement PLUS PRÉCISES que la requête ciblée
 * (« baguettes japonaises à configurer » et non « baguettes japonaises »).
 */
const shopLinks = [
  { label: "Baguettes japonaises à configurer", href: "/products/baguettes" },
  { label: "Éventails japonais sur-mesure", href: "/products/eventail" },
  { label: "Ombrelles japonaises sur-mesure", href: "/products/ombrelle" },
  // Un seul lien vers la rubrique, et non un par article cadeau : les lister
  // dans le pied de page diluerait le maillage au lieu de le renforcer. C'est
  // /offrir qui les distribue (articles cochés « Offrir » dans le backoffice).
  { label: "Idées cadeaux à faire graver", href: "/offrir" },
  { label: "Toute la boutique", href: "/store" },
]

/**
 * ⚠️ N'inscrire ici QUE des pages qui existent réellement.
 *
 * « Notre histoire » (/about), « Livraison & retours » (/livraison-retours) et
 * « CGV » (/cgv) pointaient vers des pages jamais créées : trois 404 servies
 * depuis le pied de page, donc sur TOUTES les pages du site. Elles sont
 * retirées plutôt que redirigées — un lien absent vaut mieux qu'un lien mort,
 * pour le visiteur comme pour le crawl.
 *
 * Pour rétablir l'une d'elles : créer la page dans l'admin (Blog → champ
 * « path »), vérifier qu'elle répond en 200, puis remettre sa ligne ici.
 */
const aboutLinks = [
  { label: "L'entreprise", href: "/entreprise" },
  { label: "Provenance de nos produits", href: "/provenance-de-nos-produits" },
  { label: "Le Blog", href: "/blog" },
  { label: "Contact", href: "/contact" },
]

const helpLinks = [
  // La page est publiée à /mentions-legales ; /legal n'a jamais existé.
  { label: "Mentions légales", href: "/mentions-legales" },
  // Existe en base mais n'était liée depuis aucune page : le RGPD impose
  // qu'elle reste accessible en permanence.
  {
    label: "Politique de confidentialité",
    href: "/politique-de-confidentialite",
  },
  {
    label: "Conditions générales de vente",
    href: "/cgv",
  },
  { label: "Cookies", href: "/cookies" },
]

/**
 * `library` est obligatoire ici : lucide a retiré les logos de marque de son
 * jeu, donc ni TikTok ni Pinterest n'y existent. Chaque icône est empruntée à
 * la collection qui la fournit — et doit être déclarée dans le USED de
 * `scripts/generate-icons.mjs`, sinon le SVG rendu est vide (le composant
 * Icon est hors ligne par construction, il n'y a aucun repli réseau).
 */
const socials = [
  {
    name: "Instagram",
    library: "lucide",
    icon: "instagram",
    href: "https://instagram.com",
  },
  {
    name: "TikTok",
    library: "ic",
    icon: "baseline-tiktok",
    href: "https://tiktok.com",
  },
  {
    name: "Pinterest",
    library: "typcn",
    icon: "social-pinterest",
    href: "https://pinterest.com",
  },
]

export default async function Footer() {
  return (
    <footer className="w-full bg-[#052f4a] text-[#f9fafb]">
      <div className="content-container flex flex-col w-full py-14 md:py-20">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-10 md:gap-8">
          <div className="col-span-2 md:col-span-1">
            <LocalizedClientLink
              href="/"
              className="font-semibold uppercase text-xl"
            >
              Hinaso
            </LocalizedClientLink>
            <p className="text-sm mt-3 max-w-[260px] leading-relaxed">
              Accessoires japonais à configurer en 3D. Conçus et fabriqués en
              France.
            </p>
            <div className="flex items-center gap-3 mt-5">
              {socials.map((s) => (
                <a
                  key={s.name}
                  href={s.href}
                  target="_blank"
                  rel="noreferrer"
                  className="hover:opacity-70 transition-opacity"
                  aria-label={s.name}
                >
                  <Icon name={s.icon} library={s.library} size={18} />
                </a>
              ))}
            </div>
          </div>

          <div>
            <h2 className="text-sm font-semibold mb-4">
              Boutique
            </h2>
            <ul className="flex flex-col gap-2 text-sm">
              {shopLinks.map((l) => (
                <li key={l.href}>
                  <LocalizedClientLink
                    href={l.href}
                    className="hover:opacity-70 transition-opacity"
                  >
                    {l.label}
                  </LocalizedClientLink>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h2 className="text-sm font-semibold mb-4">
              À propos
            </h2>
            <ul className="flex flex-col gap-2 text-sm">
              {aboutLinks.map((l) => (
                <li key={l.href}>
                  <LocalizedClientLink
                    href={l.href}
                    className="hover:opacity-70 transition-opacity"
                  >
                    {l.label}
                  </LocalizedClientLink>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h2 className="text-sm font-semibold mb-4">Aide</h2>
            <ul className="flex flex-col gap-2 text-sm">
              {helpLinks.map((l) => (
                <li key={l.href}>
                  <LocalizedClientLink
                    href={l.href}
                    className="hover:opacity-70 transition-opacity"
                  >
                    {l.label}
                  </LocalizedClientLink>
                </li>
              ))}
              {/* Rouvre le panneau de consentement : retirer son accord doit
                  être aussi simple que de l'avoir donné (art. 7.3 RGPD). */}
              <li>
                <CookiePreferencesLink className="text-left hover:opacity-70 transition-opacity" />
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-[#f9fafb]/20 mt-12 pt-6 flex flex-col md:flex-row items-center justify-between gap-3 text-xs">
          <span>
            © {new Date().getFullYear()} Hinaso. Tous droits
            réservés.
          </span>
        </div>
      </div>
    </footer>
  )
}
