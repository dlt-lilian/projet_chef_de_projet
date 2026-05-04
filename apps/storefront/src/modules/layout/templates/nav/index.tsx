import { Suspense } from "react"

import { listLocales } from "@lib/data/locales"
import { getLocale } from "@lib/data/locale-actions"
import { listRegions } from "@lib/data/regions"
import { StoreRegion } from "@medusajs/types"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import CartButton from "@modules/layout/components/cart-button"
import SideMenu from "@modules/layout/components/side-menu"
import { Icon, Input } from "@modules/common/components/my_ui"

export default async function Nav() {
  const [regions, locales, currentLocale] = await Promise.all([
    listRegions().then((regions: StoreRegion[]) => regions),
    listLocales(),
    getLocale(),
  ])

  return (
    <div className="sticky top-0 inset-x-0 z-50 group">
      <header className="relative mx-auto border-b border-grey-20 bg-white">
        <nav className="flex small:grid small:grid-cols-3 px-4 small:px-6 py-4 small:py-5 items-center">

          {/* LEFT — Logo + SideMenu (mobile) */}
          <div className="flex items-center gap-3 flex-1 small:flex-none">
            <div className="small:hidden">
              <SideMenu
                regions={regions}
                locales={locales}
                currentLocale={currentLocale}
              />
            </div>

            <LocalizedClientLink
              href="/"
              className="font-semibold uppercase text-lg small:text-xl text-grey-90 hover:text-primary transition-colors"
              data-testid="nav-store-link"
            >
              KŌGEI 工芸
            </LocalizedClientLink>
          </div>

          {/* CENTER — Nav links (desktop only) */}
          <div className="hidden small:flex gap-6 justify-center text-sm text-grey-90">
            <LocalizedClientLink
              href="/baguettes"
              className="flex items-center gap-1.5 hover:text-primary transition-colors"
            >
              <Icon library="hugeicons" name="chopsticks" size={18} />
              Baguettes
            </LocalizedClientLink>

            <LocalizedClientLink
              href="/eventail"
              className="flex items-center gap-1.5 hover:text-primary transition-colors"
            >
              <Icon library="lucide-lab" name="fan-handheld" size={18} />
              Éventail
            </LocalizedClientLink>

            <LocalizedClientLink
              href="/parapluie"
              className="flex items-center gap-1.5 hover:text-primary transition-colors"
            >
              <Icon name="umbrella" size={18} />
              Parapluie
            </LocalizedClientLink>

            <LocalizedClientLink
              href="/blog"
              className="flex items-center gap-1.5 hover:text-primary transition-colors"
            >
              <Icon name="letter-text" size={18} />
              Blog
            </LocalizedClientLink>
          </div>

          {/* RIGHT — Search, Account, Cart */}
          <div className="flex items-center gap-4 small:gap-5 justify-end">
            <div className="hidden small:block">
              <Input variant="search" placeholder="Rechercher..." />
            </div>

            <LocalizedClientLink
              href="/account"
              className="hidden small:flex items-center gap-1 text-grey-90 hover:text-primary transition-colors"
              data-testid="nav-account-link"
              aria-label="Mon compte"
            >
              <Icon name="user-round" size={20} />
            </LocalizedClientLink>

            <Suspense
              fallback={
                <LocalizedClientLink
                  className="flex items-center gap-1 text-grey-90 hover:text-primary transition-colors"
                  href="/cart"
                  data-testid="nav-cart-link"
                  aria-label="Panier"
                >
                  <Icon name="shopping-cart" size={20} />
                </LocalizedClientLink>
              }
            >
              <CartButton />
            </Suspense>
          </div>

        </nav>
      </header>
    </div>
  )
}
