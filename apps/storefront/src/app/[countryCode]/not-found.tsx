import { ArrowUpRightMini } from "@medusajs/icons"
import { Text } from "@modules/common/components/ui"
import { Metadata } from "next"
import Link from "next/link"

/**
 * 404 d'un pays (mauvais handle produit, région inconnue, URL /xx/… inexistante).
 *
 * Placé sous [countryCode] : il rend À L'INTÉRIEUR de app/[countryCode]/layout.tsx,
 * qui fournit <html>/<body> et le bon <html lang> du pays. Ce fichier ne porte
 * donc PAS de <html>/<body>. Les URL sans pays valide (rares : le middleware
 * préfixe tout) tombent sur le not-found interne par défaut de Next.
 */
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
