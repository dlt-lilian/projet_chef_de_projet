import { Metadata } from "next"

import LoginTemplate from "@modules/account/templates/login-template"

export const metadata: Metadata = {
  title: "Connexion",
  description: "Connectez-vous à votre compte Hinaso.",
}

/**
 * N'accepte qu'un chemin interne. La valeur vient de l'URL et finit dans une
 * redirection : sans ce filtre, `?redirect=https://…` ferait du site un
 * tremplin vers un domaine tiers. `//` est rejeté, c'est une URL
 * protocol-relative.
 */
function safeRedirect(target: string | undefined, countryCode: string) {
  if (!target?.startsWith("/") || target.startsWith("//")) {
    return undefined
  }
  return `/${countryCode}${target}`
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
