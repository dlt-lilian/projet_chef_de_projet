"use client"

import Link from "next/link"
import { useParams } from "next/navigation"
import React from "react"

/** Absolu (http, mailto, tel), protocol-relative, ou ancre : ne se préfixe pas. */
const isExternalHref = (href: string) =>
  /^[a-z][a-z0-9+.-]*:/i.test(href) ||
  href.startsWith("//") ||
  href.startsWith("#")

/**
 * `<Link />` qui conserve le code pays courant dans l'URL, sans avoir à le
 * passer en prop.
 *
 * Trois garde-fous, parce que certains `href` proviennent du backoffice
 * (slides, blocs de contenu) et ne sont pas forcément des chemins internes
 * bien formés :
 *  - href absolu ou ancre → laissé tel quel, sinon on fabriquerait
 *    `/fr/https://…` ;
 *  - slash initial normalisé → une saisie `collections/x` donnerait sinon
 *    `/frcollections/x` ;
 *  - `countryCode` absent (rendu hors de [countryCode] : certaines 404) → on
 *    sert le chemin nu, que le middleware redirige vers le bon pays. Un préfixe
 *    `/undefined/…` serait, lui, un 404 définitif.
 */
const LocalizedClientLink = ({
  children,
  href,
  ...props
}: {
  children?: React.ReactNode
  href: string
  className?: string
  onClick?: () => void
  passHref?: true
  [x: string]: unknown
}) => {
  const { countryCode } = useParams()

  let resolved = href
  if (!isExternalHref(href)) {
    const path = href.startsWith("/") ? href : `/${href}`
    resolved = typeof countryCode === "string" ? `/${countryCode}${path}` : path
  }

  return (
    <Link href={resolved} {...props}>
      {children}
    </Link>
  )
}

export default LocalizedClientLink
