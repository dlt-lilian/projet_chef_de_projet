/**
 * Formes allégées renvoyées au panneau de suggestions. Volontairement
 * distinctes des types Medusa/blog : ce payload transite à chaque frappe, on
 * n'y fait passer que ce qui est affiché.
 */

export type ProductSuggestion = {
  id: string
  title: string
  handle: string
  thumbnail: string | null
  price: string | null
}

export type ArticleSuggestion = {
  id: string
  title: string
  slug: string
  category: string
}

export type SearchSuggestions = {
  products: ProductSuggestion[]
  articles: ArticleSuggestion[]
}
