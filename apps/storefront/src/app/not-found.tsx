import { ArrowUpRightMini } from "@medusajs/icons"
import { Text } from "@modules/common/components/ui"
import { Metadata } from "next"
import Link from "next/link"

export const metadata: Metadata = {
  title: "Page introuvable",
  description: "La page que vous cherchez n'existe pas ou a été déplacée.",
}

export default function NotFound() {
  return (
    <div className="flex flex-col gap-4 items-center justify-center min-h-[calc(100vh-64px)]">
      <h1 className="text-2xl-semi text-ui-fg-base">Page introuvable</h1>
      <p className="text-small-regular text-ui-fg-base">
        La page que vous avez tenté d'ouvrir n'existe pas.
      </p>
      <Link className="flex gap-x-1 items-center group" href="/">
        <Text className="text-ui-fg-interactive">Retour à l'accueil</Text>
        <ArrowUpRightMini
          className="group-hover:rotate-45 ease-in-out duration-150"
          color="var(--fg-interactive)"
        />
      </Link>
    </div>
  )
}
