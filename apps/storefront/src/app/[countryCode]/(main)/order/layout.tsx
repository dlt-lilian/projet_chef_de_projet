import { Metadata } from "next"

// Pages de commande (confirmation, transfert de propriété) : contenu privé et
// personnalisé → hors index Google. Le `robots` couvre tout /order/*.
export const metadata: Metadata = {
  robots: { index: false, follow: false },
}

export default function OrderLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>
}
