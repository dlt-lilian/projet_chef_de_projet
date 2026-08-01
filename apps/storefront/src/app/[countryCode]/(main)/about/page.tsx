import { Metadata } from "next"

// Page placeholder (contenu à venir). Tant qu'elle est vide → `noindex` pour ne
// pas exposer de « thin content » à Google. ⚠️ Une fois le contenu rédigé :
// retirer `robots.index:false`, enrichir la description, et ajouter la page au
// sitemap (app/sitemap.ts, section "pages statiques indexables").
export const metadata: Metadata = {
  title: "Notre histoire",
  description:
    "L'histoire de Hinaso et de son artisanat japonais fait main.",
  robots: { index: false, follow: true },
}

export default function AboutPage() {
  return (
    <div className="content-container py-10 md:py-14">
      <p className="text-xs text-gray-500 mb-2">Accueil / Notre histoire</p>
      <h1 className="text-2xl md:text-3xl font-semibold mb-6 text-grey-90">
        Notre histoire
      </h1>
      <p className="text-grey-70 leading-relaxed">
        Cette page est en cours de préparation.
      </p>
    </div>
  )
}
