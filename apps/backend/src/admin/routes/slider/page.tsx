import { defineRouteConfig } from "@medusajs/admin-sdk"
import { Photo } from "@medusajs/icons"
import { Container, Heading, Text } from "@medusajs/ui"
import { SliderEditor } from "../../components/slider-editor"

// ─── Page admin « Carrousel » ─────────────────────────────────────────────────
export default function SliderPage() {
  return (
    <Container className="p-0 divide-y divide-ui-border-base">
      <div className="px-6 py-4">
        <Heading>Carrousel d'accueil</Heading>
        <Text size="small" className="text-ui-fg-muted">
          Slides affichés en haut de la page d'accueil du storefront. Les images
          sont uploadées vers R2 (dossier « Slider »).
        </Text>
      </div>
      <div className="px-6 py-5">
        <SliderEditor />
      </div>
    </Container>
  )
}

export const config = defineRouteConfig({
  label: "Carrousel",
  icon: Photo,
})
