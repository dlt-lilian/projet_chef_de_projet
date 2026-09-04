"use client"

import { XMark } from "@medusajs/icons"
import { Icon } from "@modules/common/components/my_ui/icon"
import SearchInput from "@modules/search/components/search-input"
import { useState } from "react"

const PANEL_ID = "mobile-search-panel"

/**
 * Recherche mobile : la loupe de la navbar déplie le champ sous le header.
 *
 * Le panneau est en absolute par rapport au <header> (positionné), pour ne pas
 * décaler la barre en s'ouvrant. Sur desktop le champ est déjà dans la navbar,
 * ce composant reste donc masqué au-delà de 1024 px.
 */
const MobileSearch = () => {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen((open) => !open)}
        aria-label={isOpen ? "Fermer la recherche" : "Rechercher"}
        aria-expanded={isOpen}
        aria-controls={PANEL_ID}
        data-testid="nav-search-button"
        className="flex items-center text-grey-90 hover:text-primary transition-colors small:hidden"
      >
        {isOpen ? <XMark /> : <Icon name="search" size={20} />}
      </button>

      {isOpen && (
        <div
          id={PANEL_ID}
          className="absolute top-full left-0 right-0 z-50 border-b border-grey-20 bg-white p-4 small:hidden"
        >
          {/* autoFocus : ouvrir la recherche puis devoir viser le champ du
              doigt annulerait l'intérêt du raccourci. */}
          <SearchInput
            size="full"
            autoFocus
            onSubmitted={() => setIsOpen(false)}
          />
        </div>
      )}
    </>
  )
}

export default MobileSearch
