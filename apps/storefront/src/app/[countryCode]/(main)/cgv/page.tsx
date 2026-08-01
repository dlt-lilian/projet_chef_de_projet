import { Metadata } from "next"

// Page placeholder (contenu à venir). Tant qu'elle est vide → `noindex`.
// ⚠️ Les CGV sont OBLIGATOIRES pour un e-commerce en France : à compléter avec
// le vrai texte (prix, commande, paiement, livraison, rétractation, garanties…),
// puis retirer `robots.index:false`.
export const metadata: Metadata = {
  title: "Conditions générales de vente",
  description: "Conditions générales de vente de la boutique Hinaso.",
  robots: { index: false, follow: true },
}

export default function CgvPage() {
  return (
    <div className="content-container py-10 md:py-14">
      <p className="text-xs text-gray-500 mb-2">Accueil / CGV</p>
      <h1 className="text-2xl md:text-3xl font-semibold mb-6 text-grey-90">
        Conditions générales de vente
      </h1>
      <p className="text-grey-70 leading-relaxed">
        Cette page est en cours de préparation.
      </p>
    </div>
  )
}
