import { Metadata } from "next"

import LoginTemplate from "@modules/account/templates/login-template"
import { isSafeInternalPath } from "@lib/util/safe-redirect"

export const metadata: Metadata = {
  title: "Connexion",
  description: "Connectez-vous à votre compte Hinaso.",
}

/** Chemin interne validé, préfixé du pays courant. */
function safeRedirect(target: string | undefined, countryCode: string) {
  return isSafeInternalPath(target) ? `/${countryCode}${target}` : undefined
}

export default async function Login(props: {
  params: Promise<{ countryCode: string }>
  searchParams: Promise<{ redirect?: string }>
}) {
  const { countryCode } = await props.params
  const { redirect } = await props.searchParams

  return (
    <LoginTemplate
      redirectTo={safeRedirect(redirect, countryCode)}
      notice={
        redirect?.startsWith("/checkout")
          ? "Vous devez être connecté pour finaliser votre commande."
          : undefined
      }
    />
  )
}
