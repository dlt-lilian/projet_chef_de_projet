import LocalizedClientLink from "@modules/common/components/localized-client-link"
import { Icon } from "@modules/common/components/my_ui"

const shopLinks = [
  { label: "Baguettes", href: "/baguettes" },
  { label: "Éventail", href: "/eventail" },
  { label: "Parapluie", href: "/parapluie" },
  { label: "Toute la boutique", href: "/store" },
]

const aboutLinks = [
  { label: "Le Blog", href: "/blog" },
  { label: "Notre histoire", href: "/about" },
  { label: "Contact", href: "/contact" },
]

const helpLinks = [
  { label: "Livraison & retours", href: "/blog" },
  { label: "Mentions légales", href: "/legal" },
  { label: "CGV", href: "/cgv" },
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
              KŌGEI 工芸
            </LocalizedClientLink>
            <p className="text-sm text-gray-600 mt-3 max-w-[260px] leading-relaxed">
              L'artisanat japonais à votre porte. Pièces uniques, façonnées à la
              main.
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
            <h4 className="text-sm font-semibold text-grey-90 mb-4">À propos</h4>
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
            </ul>
          </div>
        </div>

        <div className="border-t border-grey-20 mt-12 pt-6 flex flex-col md:flex-row items-center justify-between gap-3 text-xs text-gray-500">
          <span>© {new Date().getFullYear()} Kōgei. Tous droits réservés.</span>
          <span>Conçu avec soin · Made in Japan</span>
        </div>
      </div>
    </footer>
  )
}
