import LocalizedClientLink from "@modules/common/components/localized-client-link"
import { Icon } from "@modules/common/components/my_ui"
import CookiePreferencesLink from "@modules/layout/components/cookie-consent/preferences-link"

const shopLinks = [
  { label: "Baguettes", href: "/products/baguettes" },
  { label: "Éventail", href: "/products/eventail" },
  { label: "Ombrelle", href: "/products/ombrelle" },
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
  { label: "Cookies", href: "/cookies" },
]

const socials = [
  { name: "instagram", href: "https://instagram.com" },
  { name: "facebook", href: "https://facebook.com" },
  { name: "youtube", href: "https://youtube.com" },
]

export default async function Footer() {
  return (
    <footer className="border-t border-grey-20 w-full bg-white">
      <div className="content-container flex flex-col w-full py-14 md:py-20">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-10 md:gap-8">
          <div className="col-span-2 md:col-span-1">
            <LocalizedClientLink
              href="/"
              className="font-semibold uppercase text-xl text-grey-90"
            >
              Hinaso
            </LocalizedClientLink>
            <p className="text-sm text-gray-600 mt-3 max-w-[260px] leading-relaxed">
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
                  className="text-grey-70 hover:text-primary transition-colors"
                  aria-label={s.name}
                >
                  <Icon name={s.name} size={18} />
                </a>
              ))}
            </div>
          </div>

          <div>
            <h4 className="text-sm font-semibold text-grey-90 mb-4">
              Boutique
            </h4>
            <ul className="flex flex-col gap-2 text-sm text-gray-600">
              {shopLinks.map((l) => (
                <li key={l.href}>
                  <LocalizedClientLink
                    href={l.href}
                    className="hover:text-primary transition-colors"
                  >
                    {l.label}
                  </LocalizedClientLink>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="text-sm font-semibold text-grey-90 mb-4">
              À propos
            </h4>
            <ul className="flex flex-col gap-2 text-sm text-gray-600">
              {aboutLinks.map((l) => (
                <li key={l.href}>
                  <LocalizedClientLink
                    href={l.href}
                    className="hover:text-primary transition-colors"
                  >
                    {l.label}
                  </LocalizedClientLink>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="text-sm font-semibold text-grey-90 mb-4">Aide</h4>
            <ul className="flex flex-col gap-2 text-sm text-gray-600">
              {helpLinks.map((l) => (
                <li key={l.href}>
                  <LocalizedClientLink
                    href={l.href}
                    className="hover:text-primary transition-colors"
                  >
                    {l.label}
                  </LocalizedClientLink>
                </li>
              ))}
              {/* Rouvre le panneau de consentement : retirer son accord doit
                  être aussi simple que de l'avoir donné (art. 7.3 RGPD). */}
              <li>
                <CookiePreferencesLink className="text-left hover:text-primary transition-colors" />
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-grey-20 mt-12 pt-6 flex flex-col md:flex-row items-center justify-between gap-3 text-xs text-gray-500">
          <span>
            © {new Date().getFullYear()} Hinaso. Tous droits
            réservés.
          </span>
        </div>
      </div>
    </footer>
  )
}
