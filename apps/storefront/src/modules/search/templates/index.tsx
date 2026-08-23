import { searchArticles } from "@lib/blog"
import { listProducts } from "@lib/data/products"
import { getRegion } from "@lib/data/regions"
import { HttpTypes } from "@medusajs/types"
import BlogCard from "@modules/blog/components/BlogCard"
import ProductPreview from "@modules/products/components/product-preview"
import SearchInput from "@modules/search/components/search-input"

const RESULT_LIMIT = 12

type SearchTemplateProps = {
  query: string
  countryCode: string
}

const SearchTemplate = async ({ query, countryCode }: SearchTemplateProps) => {
  const trimmedQuery = query.trim()
  const region = await getRegion(countryCode)

  // Les deux sources sont indépendantes : on les interroge en parallèle plutôt
  // que d'attendre les produits avant de chercher les articles.
  const [products, articles] = await Promise.all([
    trimmedQuery && region
      ? listProducts({
          countryCode,
          queryParams: { q: trimmedQuery, limit: RESULT_LIMIT },
        }).then(({ response }) => response.products)
      : Promise.resolve([] as HttpTypes.StoreProduct[]),
    trimmedQuery ? searchArticles(trimmedQuery) : Promise.resolve([]),
  ])

  const totalResults = products.length + articles.length

  return (
    <div className="content-container py-10 md:py-14">
      <div className="mb-8 flex flex-col gap-4">
        <h1
          className="text-3xl md:text-4xl text-grey-90 font-semibold"
          data-testid="search-page-title"
        >
          {trimmedQuery ? <>Résultats pour « {trimmedQuery} »</> : "Recherche"}
        </h1>

        {/* Le champ de la navbar est masqué sous 1024 px : on le réaffiche ici
            pour pouvoir corriger sa requête sans rouvrir le menu latéral. */}
        <div className="small:hidden">
          <SearchInput size="full" defaultValue={trimmedQuery} />
        </div>

        {trimmedQuery && (
          <p className="text-sm text-gray-500" data-testid="search-result-count">
            {totalResults === 0
              ? "Aucun résultat."
              : `${totalResults} résultat${totalResults > 1 ? "s" : ""}`}
          </p>
        )}
      </div>

      {!trimmedQuery && (
        <p className="py-24 text-center text-sm text-gray-500">
          Saisissez un terme pour chercher parmi les produits et les articles.
        </p>
      )}

      {trimmedQuery && totalResults === 0 && (
        <div className="py-24 text-center">
          <p className="text-sm text-gray-500">
            Aucun produit ni article ne correspond à « {trimmedQuery} ».
          </p>
        </div>
      )}

      {products.length > 0 && region && (
        <section className="flex flex-col gap-6 mb-14">
          <h2 className="text-2xl font-semibold text-grey-90">
            Produits{" "}
            <span className="text-gray-500 font-normal">
              ({products.length})
            </span>
          </h2>
          <ul
            className="grid grid-cols-1 sm:grid-cols-3 gap-5 md:gap-6 w-full"
            data-testid="search-products"
          >
            {products.map((product) => (
              <li key={product.id}>
                <ProductPreview product={product} region={region} />
              </li>
            ))}
          </ul>
        </section>
      )}

      {articles.length > 0 && (
        <section className="flex flex-col gap-6">
          <h2 className="text-2xl font-semibold text-grey-90">
            Articles{" "}
            <span className="text-gray-500 font-normal">
              ({articles.length})
            </span>
          </h2>
          <ul
            className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 md:gap-8 w-full"
            data-testid="search-articles"
          >
            {articles.map((article) => (
              <li key={article.id}>
                <BlogCard slug={article.slug} post={article} />
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  )
}

export default SearchTemplate
