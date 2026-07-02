import { defineWidgetConfig } from "@medusajs/admin-sdk"
import { useEffect, useState } from "react"
import { Container, Heading, Text, Button, toast } from "@medusajs/ui"
import {
  type Product,
  fetchProducts,
  ProductConfigBlock,
  CreateForHandle,
} from "../components/configurator-editor"

type ProductDetail = { id: string; handle: string }

// Widget affiché en bas de la fiche produit admin : édite la config du
// configurateur 3D du produit courant (même UI que la section dédiée), ou
// propose de l'activer si le produit n'a pas encore de configurateur.
const ConfiguratorProductWidget = ({ data }: { data: ProductDetail }) => {
  const [product, setProduct] = useState<Product | null>(null)
  const [loading, setLoading] = useState(true)

  // Ne remet PAS loading à true : évite de flasher « Chargement… » à chaque
  // sauvegarde (même comportement que la section dédiée).
  const load = async () => {
    try {
      const all = await fetchProducts()
      setProduct(all.find((p) => p.handle === data.handle) ?? null)
    } catch {
      toast.error("Impossible de charger le configurateur.")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [data.handle])

  return (
    <Container className="divide-y divide-ui-border-base p-0">
      <div className="flex items-center justify-between px-6 py-4">
        <div>
          <Heading level="h2">Configurateur 3D</Heading>
          <Text size="small" className="text-ui-fg-muted">
            Options et choix affichés dans le configurateur 3D de ce produit.
          </Text>
        </div>
        <a href="/app/configurator">
          <Button size="small" variant="secondary">
            Section complète
          </Button>
        </a>
      </div>

      <div className="px-6 py-5">
        {loading ? (
          <Text size="small" className="text-ui-fg-muted">Chargement…</Text>
        ) : product ? (
          <ProductConfigBlock product={product} onChanged={load} />
        ) : (
          <CreateForHandle handle={data.handle} onCreated={load} />
        )}
      </div>
    </Container>
  )
}

export const config = defineWidgetConfig({
  zone: "product.details.after",
})

export default ConfiguratorProductWidget
