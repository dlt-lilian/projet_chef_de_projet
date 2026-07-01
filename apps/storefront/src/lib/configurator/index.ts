import type {
  ConfigurableHandle,
  ConfiguratorProductConfig,
} from "@modules/configurator/config/configurableProducts"

/**
 * Récupère la configuration d'un produit configurable depuis le backend Medusa
 * (table configurator_*), au lieu du fichier statique configurableProducts.ts.
 *
 * `.replace(/\/+$/, "")` retire un éventuel slash final de l'URL backend
 * (sinon `…app//store/configurator` → 404, cf. bug blog).
 */
const BACKEND_URL = (
  process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL ?? "http://localhost:9000"
).replace(/\/+$/, "")

function headers() {
  return {
    "Content-Type": "application/json",
    "x-publishable-api-key":
      process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY ?? "",
  }
}

export async function fetchProductConfig(
  handle: ConfigurableHandle
): Promise<ConfiguratorProductConfig | null> {
  try {
    const res = await fetch(`${BACKEND_URL}/store/configurator/${handle}`, {
      headers: headers(),
      next: { revalidate: 60 },
    })
    if (!res.ok) return null
    const { config } = await res.json()
    return (config ?? null) as ConfiguratorProductConfig | null
  } catch (err) {
    console.error(
      `[configurator] fetchProductConfig("${handle}") a échoué (${BACKEND_URL}) :`,
      err
    )
    return null
  }
}
