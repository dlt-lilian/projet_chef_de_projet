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
      <header className="relative mx-auto border-b duration-200 bg-white">
        <nav className="grid grid-cols-3 p-5 items-center">

          {/* LEFT — Logo + SideMenu (mobile) */}
          <div className="flex items-center gap-4">
            {/* SideMenu visible only on mobile */}
            <div className="small:hidden">
              <SideMenu
                regions={regions}
                locales={locales}
                currentLocale={currentLocale}
              />
            </div>

            <LocalizedClientLink
              href="/"
              className="font-semibold uppercase text-xl"
              data-testid="nav-store-link"
            >
              KŌGEI 工芸
            </LocalizedClientLink>
          </div>

          {/* CENTER — Nav links (desktop only) */}
          <div className="hidden small:flex gap-5 justify-center">
            <LocalizedClientLink
              href="/baguettes"
              className="flex items-center gap-1 transition-colors"
            >
              <Icon library="hugeicons" name="chopsticks" />
              Baguettes
            </LocalizedClientLink>

            <LocalizedClientLink
              href="/eventail"
              className="flex items-center gap-1 transition-colors"
            >
              <Icon library="lucide-lab" name="fan-handheld" />
              Éventail
            </LocalizedClientLink>

            <LocalizedClientLink
              href="/parapluie"
              className="flex items-center gap-1 transition-colors"
            >
              <Icon name="umbrella" />
              Parapluie
            </LocalizedClientLink>

            <LocalizedClientLink
              href="/blog"
              className="flex items-center gap-transition-colors"
            >
              <Icon name="letter-text" />
              Blog
            </LocalizedClientLink>
          </div>

          {/* RIGHT — Search, Account, Cart */}
          <div className="flex items-center gap-5 justify-end">
            <div className="hidden small:block">
              <Input variant="search" placeholder="Rechercher..." />
            </div>

            <LocalizedClientLink
              href="/account"
              className="hidden small:flex items-center gap-1 transition-colors"
              data-testid="nav-account-link"
            >
              <Icon name="user-round" />
              Account
            </LocalizedClientLink>

            <Suspense
              fallback={
                <LocalizedClientLink
                  className="flex items-center gap-1 hover:text-ui-fg-base"
                  href="/cart"
                  data-testid="nav-cart-link"
                >
                  <Icon name="shopping-cart" />
                  Cart (0)
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