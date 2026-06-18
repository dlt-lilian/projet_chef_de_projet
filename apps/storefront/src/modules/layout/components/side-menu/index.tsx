"use client"

import { Popover, PopoverPanel, Transition } from "@headlessui/react"
import useToggleState from "@lib/hooks/use-toggle-state"
import { ArrowRightMini, XMark } from "@medusajs/icons"
import { HttpTypes } from "@medusajs/types"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import { Text, clx } from "@modules/common/components/ui"
import { Icon, Input } from "@modules/common/components/my_ui"
import { Fragment } from "react"
import CountrySelect from "../country-select"
import LanguageSelect from "../language-select"
import { Locale } from "@lib/data/locales"

const NavItems = [
  { name: "Accueil", href: "/", icon: "home" },
  { name: "Baguettes", href: "/baguettes", icon: "chopsticks", library: "hugeicons" as const },
  { name: "Éventail", href: "/eventail", icon: "fan-handheld", library: "lucide-lab" as const },
  { name: "Parapluie", href: "/parapluie", icon: "umbrella" },
  { name: "Blog", href: "/blog", icon: "letter-text" },
  { name: "Contact", href: "/contact", icon: "mail" },
  { name: "Compte", href: "/account", icon: "user-round" },
  { name: "Panier", href: "/cart", icon: "shopping-cart" },
]

type SideMenuProps = {
  regions: HttpTypes.StoreRegion[] | null
  locales: Locale[] | null
  currentLocale: string | null
}

const SideMenu = ({ regions, locales, currentLocale }: SideMenuProps) => {
  const countryToggleState = useToggleState()
  const languageToggleState = useToggleState()

  return (
    <div className="h-full">
      <div className="flex items-center h-full">
        <Popover className="h-full flex">
          {({ open, close }) => (
            <>
              <div className="relative flex h-full">
                <Popover.Button
                  data-testid="nav-menu-button"
                  className="relative h-full flex items-center transition-all ease-out duration-200 focus:outline-none hover:text-primary"
                  aria-label="Ouvrir le menu"
                >
                  <Icon name="menu" size={22} />
                </Popover.Button>
              </div>

              {open && (
                <div
                  className="fixed inset-0 z-[50] bg-black/30 pointer-events-auto"
                  onClick={close}
                  data-testid="side-menu-backdrop"
                />
              )}

              <Transition
                show={open}
                as={Fragment}
                enter="transition ease-out duration-200"
                enterFrom="opacity-0 -translate-x-2"
                enterTo="opacity-100 translate-x-0"
                leave="transition ease-in duration-150"
                leaveFrom="opacity-100 translate-x-0"
                leaveTo="opacity-0 -translate-x-2"
              >
                <PopoverPanel className="fixed top-0 left-0 w-[85%] max-w-[360px] h-screen z-[51] bg-white shadow-xl">
                  <div
                    data-testid="nav-menu-popup"
                    className="flex flex-col h-full p-6 gap-6"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-semibold uppercase text-lg text-grey-90">
                        KŌGEI 工芸
                      </span>
                      <button
                        data-testid="close-menu-button"
                        onClick={close}
                        aria-label="Fermer le menu"
                        className="text-grey-70 hover:text-primary"
                      >
                        <XMark />
                      </button>
                    </div>

                    <Input
                      variant="search"
                      placeholder="Rechercher..."
                      size="full"
                    />

                    <ul className="flex flex-col gap-1">
                      {NavItems.map((item) => (
                        <li key={item.href}>
                          <LocalizedClientLink
                            href={item.href}
                            className="flex items-center gap-3 px-3 py-3 rounded-xl text-grey-90 hover:bg-grey-20 transition-colors"
                            onClick={close}
                            data-testid={`${item.name.toLowerCase()}-link`}
                          >
                            <Icon
                              name={item.icon}
                              library={item.library ?? "lucide"}
                              size={18}
                            />
                            <span className="text-sm">{item.name}</span>
                          </LocalizedClientLink>
                        </li>
                      ))}
                    </ul>

                    <div className="mt-auto flex flex-col gap-y-4 pt-6 border-t border-grey-20">
                      {!!locales?.length && (
                        <div
                          className="flex justify-between text-grey-70"
                          onMouseEnter={languageToggleState.open}
                          onMouseLeave={languageToggleState.close}
                        >
                          <LanguageSelect
                            toggleState={languageToggleState}
                            locales={locales}
                            currentLocale={currentLocale}
                          />
                          <ArrowRightMini
                            className={clx(
                              "transition-transform duration-150",
                              languageToggleState.state ? "-rotate-90" : ""
                            )}
                          />
                        </div>
                      )}
                      <div
                        className="flex justify-between text-grey-70"
                        onMouseEnter={countryToggleState.open}
                        onMouseLeave={countryToggleState.close}
                      >
                        {regions && (
                          <CountrySelect
                            toggleState={countryToggleState}
                            regions={regions}
                          />
                        )}
                        <ArrowRightMini
                          className={clx(
                            "transition-transform duration-150",
                            countryToggleState.state ? "-rotate-90" : ""
                          )}
                        />
                      </div>
                      <Text className="text-xs text-gray-500">
                        © {new Date().getFullYear()} Kōgei.
                      </Text>
                    </div>
                  </div>
                </PopoverPanel>
              </Transition>
            </>
          )}
        </Popover>
      </div>
    </div>
  )
}

export default SideMenu
