"use client"

import dynamic from "next/dynamic"
import { useEffect, useState } from "react"
import { Icon } from "@modules/common/components/my_ui/icon"
import type { SideMenuProps } from "./panel"

/**
 * Coquille légère du menu latéral.
 *
 * Le panneau réel (Popover + Transition de Headless UI, plus les sélecteurs de
 * pays et de langue, eux aussi Headless UI) représente l'essentiel des ~100 Ko
 * de JS brut que la Nav faisait charger et hydrater sur **chaque page**. Or ce
 * menu est rendu dans un `small:hidden` : au-delà de 1024 px il est masqué en
 * CSS, donc sur desktop ce coût était intégralement payé pour un composant que
 * personne ne voit jamais.
 *
 * On rend donc d'abord un bouton statique — même balisage et mêmes classes que
 * le `Popover.Button` du panneau, pour qu'aucun pixel ne bouge à la bascule —
 * et on ne monte le vrai panneau qu'une fois le thread principal libre.
 *
 * Pourquoi `requestIdleCallback` et pas un montage au clic : le `Popover` de
 * Headless UI v2 n'accepte pas de prop `defaultOpen` (vérifié dans ses types) —
 * un montage déclenché par le clic afficherait le panneau fermé et obligerait à
 * cliquer une seconde fois. L'idle arrive en pratique bien avant la première
 * interaction ; le `onClick` du placeholder sert de filet si l'utilisateur est
 * plus rapide que le navigateur.
 */
const SideMenuPanel = dynamic(() => import("./panel"), { ssr: false })

const SideMenu = (props: SideMenuProps) => {
  const [ready, setReady] = useState(false)

  useEffect(() => {
    if (typeof window === "undefined") return

    if ("requestIdleCallback" in window) {
      // `timeout` garantit que le panneau finit par se monter même si le thread
      // ne devient jamais franchement inactif.
      const id = window.requestIdleCallback(() => setReady(true), {
        timeout: 2000,
      })
      return () => window.cancelIdleCallback(id)
    }

    // Safari < 16.4 n'a pas requestIdleCallback.
    const timer = window.setTimeout(() => setReady(true), 1000)
    return () => window.clearTimeout(timer)
  }, [])

  if (ready) return <SideMenuPanel {...props} />

  return (
    <div className="h-full">
      <div className="flex items-center h-full">
        {/* Reproduit la structure du panneau : <Popover> rend un <div> portant
            `h-full flex`, qui contient lui-même le wrapper du bouton. */}
        <div className="h-full flex">
          <div className="relative flex h-full">
            <button
              type="button"
              data-testid="nav-menu-button"
              className="relative h-full flex items-center transition-all ease-out duration-200 focus:outline-none hover:text-primary"
              aria-label="Ouvrir le menu"
              onClick={() => setReady(true)}
            >
              <Icon name="menu" size={22} />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default SideMenu
