import { Metadata } from "next"

// Page placeholder (contenu à venir). Tant qu'elle est vide → `noindex` pour ne
// pas exposer de « thin content ». ⚠️ Une fois rédigée (délais, transporteurs,
// frais de port, procédure et délais de retour, remboursement…) : retirer
// `robots.index:false` et ajouter la page au sitemap (app/sitemap.ts).
export const metadata: Metadata = {
  title: "Livraison & retours",
  description:
    "Informations de livraison et de retours pour vos commandes Hinaso.",
  robots: { index: false, follow: true },
}

export default function ShippingReturnsPage() {
  return (
    <div className="content-container py-10 md:py-14">
      <p className="text-xs text-gray-500 mb-2">Accueil / Livraison & retours</p>
      <h1 className="text-2xl md:text-3xl font-semibold mb-6 text-grey-90">
        Livraison & retours
      </h1>
      <p className="text-grey-70 leading-relaxed">
        Cette page est en cours de préparation.
      </p>
    </div>
  )
}
