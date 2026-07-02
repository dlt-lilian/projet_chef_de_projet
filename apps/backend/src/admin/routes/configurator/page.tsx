import { defineRouteConfig } from "@medusajs/admin-sdk"
import { Swatch } from "@medusajs/icons"
import { useEffect, useState } from "react"
import { Container, Heading, Text, toast } from "@medusajs/ui"
import {
  type Product,
  fetchProducts,
  ProductConfigBlock,
  AddProduct,
} from "../../components/configurator-editor"

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function ConfiguratorPage() {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)

  const load = async () => {
    try {
      setProducts(await fetchProducts())
    } catch {
      toast.error("Impossible de charger la configuration.")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  return (
    <Container className="p-0 divide-y divide-ui-border-base">
      <div className="px-6 py-4">
        <Heading>Configurateur 3D</Heading>
        <Text size="small" className="text-ui-fg-muted">
          Produits, options et choix du configurateur 3D.
        </Text>
      </div>

      {loading && (
        <div className="px-6 py-8">
          <Text size="small" className="text-ui-fg-muted">Chargement…</Text>
        </div>
      )}

      {!loading && products.length === 0 && (
        <div className="px-6 py-8">
          <Text size="small" className="text-ui-fg-muted">
            Aucun produit configurable. Lance le seed « seed-configurator »
            ou crée-en un ci-dessous.
          </Text>
        </div>
      )}

      {products.map((product) => (
        <div key={product.id} className="px-6 py-5">
          <div className="mb-3 flex items-center gap-2">
            <Heading level="h2" className="capitalize">{product.handle}</Heading>
          </div>

          <ProductConfigBlock product={product} onChanged={load} />
        </div>
      ))}

      <AddProduct onAdded={load} />
    </Container>
  )
}

export const config = defineRouteConfig({
  label: "Configurateur",
  icon: Swatch,
})
