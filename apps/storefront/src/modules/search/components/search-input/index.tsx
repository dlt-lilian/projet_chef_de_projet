"use client"

import { Input } from "@modules/common/components/my_ui"
import { clx } from "@modules/common/components/ui"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import { searchSuggestions } from "@modules/search/actions"
import type { SearchSuggestions } from "@modules/search/types"
import Image from "next/image"
import { useParams, useRouter } from "next/navigation"
import {
  FocusEvent,
  FormEvent,
  KeyboardEvent,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
} from "react"

/** Délai d'inactivité avant d'interroger le serveur. */
const DEBOUNCE_MS = 250
/** En deçà, le bruit dépasse l'intérêt des résultats. */
const MIN_QUERY_LENGTH = 2
/** Aucune option surlignée. */
const NO_ACTIVE_OPTION = -1

const NO_RESULTS: SearchSuggestions = { products: [], articles: [] }

type SearchInputProps = {
  size?: "max" | "full"
  /** Valeur initiale du champ (page de résultats : on réaffiche la requête). */
  defaultValue?: string
  /** Appelé après validation — sert à refermer le menu latéral sur mobile. */
  onSubmitted?: () => void
}

/**
 * Champ de recherche de la navbar, avec panneau de suggestions vives sous le
 * champ. Entrée mène à /search pour la liste complète, sauf si une option est
 * surlignée aux flèches — auquel cas elle l'ouvre directement.
 *
 * Motif combobox : le focus ne quitte jamais le champ, les options sont
 * désignées par `aria-activedescendant`. D'où le `tabIndex={-1}` sur les liens,
 * Tab sortant du widget plutôt que de parcourir les résultats.
 */
const SearchInput = ({
  size = "max",
  defaultValue = "",
  onSubmitted,
}: SearchInputProps) => {
  const { countryCode } = useParams()
  const router = useRouter()
  // Plusieurs champs coexistent (navbar, menu latéral, page de résultats) :
  // leurs identifiants d'options doivent rester distincts.
  const listboxId = useId()

  const [query, setQuery] = useState(defaultValue)
  const [results, setResults] = useState<SearchSuggestions>(NO_RESULTS)
  const [isLoading, setIsLoading] = useState(false)
  const [isOpen, setIsOpen] = useState(false)
  const [activeIndex, setActiveIndex] = useState(NO_ACTIVE_OPTION)

  // Une frappe rapide peut faire revenir une requête ancienne APRÈS une plus
  // récente : on ne retient que la réponse du dernier appel émis.
  const latestRequest = useRef(0)

  const trimmedQuery = query.trim()
  const hasQuery = trimmedQuery.length >= MIN_QUERY_LENGTH

  useEffect(() => {
    // Panneau fermé → rien à chercher. Évite notamment une requête au
    // chargement de /search, où le champ est pré-rempli mais pas focalisé.
    if (!isOpen || !hasQuery) {
      latestRequest.current++ // invalide toute requête encore en vol
      setResults(NO_RESULTS)
      setIsLoading(false)
      return
    }

    setIsLoading(true)
    const requestId = ++latestRequest.current

    const timer = setTimeout(async () => {
      const suggestions = await searchSuggestions(
        trimmedQuery,
        String(countryCode)
      ).catch(() => NO_RESULTS)

      if (requestId !== latestRequest.current) {
        return
      }

      setResults(suggestions)
      setIsLoading(false)
    }, DEBOUNCE_MS)

    return () => clearTimeout(timer)
  }, [trimmedQuery, hasQuery, isOpen, countryCode])

  const hasResults = results.products.length > 0 || results.articles.length > 0

  /**
   * Les options telles que les flèches les parcourent : produits, puis
   * articles, puis « Voir tous les résultats ». L'ordre doit rester celui du
   * rendu, chaque section lisant son décalage plus bas.
   */
  const options = useMemo(() => {
    const list: { id: string; href: string }[] = []

    results.products.forEach((product) =>
      list.push({
        id: `${listboxId}-product-${product.id}`,
        href: `/products/${product.handle}`,
      })
    )
    results.articles.forEach((article) =>
      list.push({
        id: `${listboxId}-article-${article.id}`,
        href: `/blog/${article.slug}`,
      })
    )
    if (results.products.length > 0 || results.articles.length > 0) {
      list.push({
        id: `${listboxId}-all`,
        href: `/search?q=${encodeURIComponent(trimmedQuery)}`,
      })
    }

    return list
  }, [results, trimmedQuery, listboxId])

  // Des résultats fraîchement arrivés ne doivent pas hériter du surlignage
  // portant sur la liste précédente.
  useEffect(() => {
    setActiveIndex(NO_ACTIVE_OPTION)
  }, [results])

  // Le panneau défile : l'option atteinte aux flèches doit rester visible.
  useEffect(() => {
    if (activeIndex === NO_ACTIVE_OPTION) {
      return
    }

    document
      .getElementById(options[activeIndex]?.id)
      ?.scrollIntoView({ block: "nearest" })
  }, [activeIndex, options])

  const close = () => {
    setIsOpen(false)
    setActiveIndex(NO_ACTIVE_OPTION)
  }

  const goTo = (href: string) => {
    close()
    router.push(`/${countryCode}${href}`)
    onSubmitted?.()
  }

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    if (!trimmedQuery) {
      return
    }

    goTo(`/search?q=${encodeURIComponent(trimmedQuery)}`)
  }

  const handleResultClick = () => {
    close()
    onSubmitted?.()
  }

  // Le panneau contient des liens : on ne ferme que si le focus sort réellement
  // du bloc champ + panneau.
  const handleBlur = (event: FocusEvent<HTMLDivElement>) => {
    if (!event.currentTarget.contains(event.relatedTarget as Node | null)) {
      close()
    }
  }

  const moveActiveOption = (offset: number) => {
    if (options.length === 0) {
      return
    }

    setActiveIndex((current) => {
      // Depuis « aucune option », ↑ entre par la fin de la liste.
      if (current === NO_ACTIVE_OPTION) {
        return offset > 0 ? 0 : options.length - 1
      }
      return (current + offset + options.length) % options.length
    })
  }

  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    switch (event.key) {
      case "Escape":
        close()
        break

      case "ArrowDown":
        // Sinon le curseur saute en fin de champ pendant qu'on descend.
        event.preventDefault()
        if (!isOpen) {
          setIsOpen(true)
          break
        }
        moveActiveOption(1)
        break

      case "ArrowUp":
        event.preventDefault()
        if (!isOpen) {
          setIsOpen(true)
          break
        }
        moveActiveOption(-1)
        break

      case "Enter": {
        const activeOption = options[activeIndex]
        if (!isOpen || !activeOption) {
          break // laisse le formulaire partir vers /search
        }
        // Une option est surlignée : elle prime sur la page de résultats.
        event.preventDefault()
        goTo(activeOption.href)
        break
      }
    }
  }

  const optionClassName = (index: number) =>
    clx("rounded-rounded px-2 py-2 transition-colors", {
      "bg-grey-10": index === activeIndex,
    })

  const articlesOffset = results.products.length
  const allResultsIndex = options.length - 1

  return (
    <div
      className={clx("relative", { "w-full": size === "full" })}
      onBlur={handleBlur}
      onKeyDown={handleKeyDown}
    >
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
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          onFocus={() => setIsOpen(true)}
          placeholder="Rechercher..."
          aria-label="Rechercher un produit ou un article"
          role="combobox"
          aria-expanded={isOpen && hasQuery}
          aria-controls={listboxId}
          aria-autocomplete="list"
          aria-activedescendant={
            activeIndex === NO_ACTIVE_OPTION
              ? undefined
              : options[activeIndex]?.id
          }
          autoComplete="off"
        />
      </form>

      {/* Les résultats apparaissent sans action de l'utilisateur : on annonce
          leur nombre, sinon leur arrivée passe inaperçue au lecteur d'écran. */}
      <p className="sr-only" role="status" aria-live="polite">
        {isOpen && hasQuery && !isLoading
          ? `${results.products.length + results.articles.length} résultat(s) pour ${trimmedQuery}`
          : ""}
      </p>

      {isOpen && hasQuery && (
        <div
          id={listboxId}
          role="listbox"
          aria-label="Suggestions de recherche"
          className={clx(
            "absolute top-full mt-2 z-50 max-h-[70vh] overflow-y-auto rounded-rounded border border-grey-20 bg-white shadow-lg",
            size === "full" ? "left-0 right-0" : "right-0 w-[380px]"
          )}
          data-testid="search-suggestions"
        >
          {isLoading && !hasResults && (
            <p className="px-4 py-6 text-center text-sm text-gray-500">
              Recherche…
            </p>
          )}

          {!isLoading && !hasResults && (
            <p className="px-4 py-6 text-center text-sm text-gray-500">
              Aucun résultat pour « {trimmedQuery} ».
            </p>
          )}

          {results.products.length > 0 && (
            <section className="p-2">
              <h3 className="px-2 py-1 text-[10px] uppercase tracking-[0.2em] text-gray-500">
                Produits
              </h3>
              <ul>
                {results.products.map((product, index) => (
                  <li key={product.id}>
                    <LocalizedClientLink
                      href={`/products/${product.handle}`}
                      id={`${listboxId}-product-${product.id}`}
                      role="option"
                      aria-selected={index === activeIndex}
                      tabIndex={-1}
                      onMouseEnter={() => setActiveIndex(index)}
                      onClick={handleResultClick}
                      className={clx(
                        "flex items-center gap-3",
                        optionClassName(index)
                      )}
                    >
                      <span className="relative h-12 w-12 shrink-0 overflow-hidden rounded-base bg-grey-10">
                        {product.thumbnail && (
                          <Image
                            src={product.thumbnail}
                            alt={product.title}
                            fill
                            sizes="48px"
                            className="object-cover"
                          />
                        )}
                      </span>
                      <span className="flex min-w-0 flex-col">
                        <span className="truncate text-sm text-grey-90">
                          {product.title}
                        </span>
                        {product.price && (
                          <span className="text-xs text-gray-500">
                            {product.price}
                          </span>
                        )}
                      </span>
                    </LocalizedClientLink>
                  </li>
                ))}
              </ul>
            </section>
          )}

          {results.articles.length > 0 && (
            <section className="border-t border-grey-20 p-2">
              <h3 className="px-2 py-1 text-[10px] uppercase tracking-[0.2em] text-gray-500">
                Articles
              </h3>
              <ul>
                {results.articles.map((article, position) => {
                  const index = articlesOffset + position

                  return (
                    <li key={article.id}>
                      <LocalizedClientLink
                        href={`/blog/${article.slug}`}
                        id={`${listboxId}-article-${article.id}`}
                        role="option"
                        aria-selected={index === activeIndex}
                        tabIndex={-1}
                        onMouseEnter={() => setActiveIndex(index)}
                        onClick={handleResultClick}
                        className={clx("flex flex-col", optionClassName(index))}
                      >
                        <span className="line-clamp-2 text-sm text-grey-90">
                          {article.title}
                        </span>
                        {article.category && (
                          <span className="text-[10px] uppercase tracking-[0.2em] text-gray-500">
                            {article.category}
                          </span>
                        )}
                      </LocalizedClientLink>
                    </li>
                  )
                })}
              </ul>
            </section>
          )}

          {hasResults && (
            <LocalizedClientLink
              href={`/search?q=${encodeURIComponent(trimmedQuery)}`}
              id={`${listboxId}-all`}
              role="option"
              aria-selected={allResultsIndex === activeIndex}
              tabIndex={-1}
              onMouseEnter={() => setActiveIndex(allResultsIndex)}
              onClick={handleResultClick}
              className={clx(
                "block border-t border-grey-20 px-4 py-3 text-center text-sm text-primary transition-colors",
                { "bg-grey-10": allResultsIndex === activeIndex }
              )}
            >
              Voir tous les résultats
            </LocalizedClientLink>
          )}
        </div>
      )}
    </div>
  )
}

export default SearchInput
