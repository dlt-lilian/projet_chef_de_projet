import { Metadata } from "next"

import InteractiveLink from "@modules/common/components/interactive-link"

export const metadata: Metadata = {
  title: "404",
  description: "Une erreur est survenue",
}

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-64px)]">
      <h1 className="text-2xl-semi text-ui-fg-base">Page introuvable</h1>
      <p className="text-small-regular text-ui-fg-base">
        Le panier que vous avez tenté d&apos;atteindre n&apos;existe pas. Videz
        vos cookies et réessayez.
      </p>
      <InteractiveLink href="/">Retour à l&apos;accueil</InteractiveLink>
    </div>
  )
}
