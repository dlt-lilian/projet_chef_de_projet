"use client"

import { Input } from "@modules/common/components/my_ui"
import { useParams, useRouter } from "next/navigation"
import { FormEvent } from "react"

type SearchInputProps = {
  size?: "max" | "full"
  /** Valeur initiale du champ (page de résultats : on réaffiche la requête). */
  defaultValue?: string
  /** Appelé après validation — sert à refermer le menu latéral sur mobile. */
  onSubmitted?: () => void
}

/**
 * Champ de recherche de la navbar. Volontairement non contrôlé : il vit dans le
 * layout, donc à chaque frappe un `useState` re-rendrait toute la nav pour rien.
 * On lit la valeur au submit via FormData.
 *
 * Le pays est repris de l'URL courante plutôt que via LocalizedClientLink, la
 * navigation étant déclenchée par le routeur et non par un lien.
 */
const SearchInput = ({
  size = "max",
  defaultValue,
  onSubmitted,
}: SearchInputProps) => {
  const { countryCode } = useParams()
  const router = useRouter()

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    const query = String(new FormData(event.currentTarget).get("q") ?? "").trim()
    if (!query) {
      return
    }

    router.push(`/${countryCode}/search?q=${encodeURIComponent(query)}`)
    onSubmitted?.()
  }

  return (
    <form
      role="search"
      onSubmit={handleSubmit}
      className={size === "full" ? "w-full" : undefined}
    >
      <Input
        type="search"
        variant="search"
        name="q"
        size={size}
        defaultValue={defaultValue}
        placeholder="Rechercher..."
        aria-label="Rechercher un produit ou un article"
      />
    </form>
  )
}

export default SearchInput
