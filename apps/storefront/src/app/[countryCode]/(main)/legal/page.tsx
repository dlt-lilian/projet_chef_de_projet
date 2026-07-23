import { Metadata } from "next"

// Page placeholder (contenu à venir). Tant qu'elle est vide → `noindex`.
// ⚠️ Les mentions légales sont OBLIGATOIRES pour un e-commerce en France :
// à compléter avec le vrai texte (éditeur, hébergeur, SIRET, contact…), puis
// retirer `robots.index:false`.
export const metadata: Metadata = {
  title: "Mentions légales",
  description: "Mentions légales du site Hinaso.",
  robots: { index: false, follow: true },
}

export default function LegalPage() {
  return (
    <div className="content-container py-10 md:py-14">
      <p className="text-xs text-gray-500 mb-2">Accueil / Mentions légales</p>
      <h1 className="text-2xl md:text-3xl font-semibold mb-6 text-grey-90">
        Mentions légales
      </h1>
      <p className="text-grey-70 leading-relaxed">
        Cette page est en cours de préparation.
      </p>
    </div>
  )
}
