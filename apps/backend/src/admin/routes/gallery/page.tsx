import { defineRouteConfig } from "@medusajs/admin-sdk"
import { Photo } from "@medusajs/icons"
import { Container, Heading, Text } from "@medusajs/ui"
import { GalleryEditor } from "../../components/gallery-editor"

// ─── Page admin « Galerie » ───────────────────────────────────────────────────
export default function GalleryPage() {
  return (
    <Container className="p-0 divide-y divide-ui-border-base">
      <div className="px-6 py-4">
        <Heading>Galerie d'accueil</Heading>
        <Text size="small" className="text-ui-fg-muted">
          Grille d'images (masonry) affichée sur la page d'accueil du storefront.
          Les images sont uploadées vers R2 (dossier « Gallery »).
        </Text>
      </div>
      <div className="px-6 py-5">
        <GalleryEditor />
      </div>
    </Container>
  )
}

export const config = defineRouteConfig({
  label: "Galerie",
  icon: Photo,
})
