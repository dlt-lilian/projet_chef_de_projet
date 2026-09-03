import type { ProductFaqItem, ProductSection } from "@lib/content/products"

/**
 * Bloc éditorial (texte + FAQ) — partagé par les fiches produit et les pages
 * de catégorie. D'où sa place dans `common/` : il ne connaît ni produit ni
 * catégorie, seulement des sections et des questions.
 *
 * Composant SERVEUR : le texte est présent dans le HTML initial, sans dépendre
 * de l'hydratation. C'est indispensable sur les fiches — elles rendent le
 * configurateur 3D, un composant client dont le corps ne contient quasiment
 * aucun texte indexable.
 *
 * Hiérarchie des titres : le H1 appartient à la page hôte (titre produit ou nom
 * de catégorie). Ce bloc n'ouvre donc qu'à partir du H2, et les questions de la
 * FAQ sont des H3 — un seul H1 par page, aucun niveau sauté.
 */
type EditorialContent = {
  /** Absent sur les catégories : leur chapô vient de `category.description`. */
  intro?: string[]
  sections: ProductSection[]
  faq: ProductFaqItem[]
}

export default function EditorialSection({
  editorial,
}: {
  editorial: EditorialContent
}) {
  return (
    <section
      className="content-container max-w-3xl py-12 md:py-16"
      data-testid="product-editorial"
    >
      {editorial.intro && editorial.intro.length > 0 && (
        <div className="flex flex-col gap-4 text-base leading-relaxed text-stone-700">
          {editorial.intro.map((p, i) => (
            <p key={i}>{p}</p>
          ))}
        </div>
      )}

      {editorial.sections.map((section, index) => (
        <div
          key={section.heading}
          className={index === 0 && !editorial.intro ? "" : "mt-10"}
        >
          <h2 className="text-xl md:text-2xl font-semibold text-stone-900 mb-4">
            {section.heading}
          </h2>
          <div className="flex flex-col gap-4 text-base leading-relaxed text-stone-700">
            {section.paragraphs.map((p, i) => (
              <p key={i}>{p}</p>
            ))}
          </div>
        </div>
      ))}

      {editorial.faq.length > 0 && (
        <div className="mt-12">
          <h2 className="text-xl md:text-2xl font-semibold text-stone-900 mb-6">
            Questions fréquentes
          </h2>
          {/* <dl> plutôt qu'un accordéon : la réponse est dans le HTML initial,
              donc lisible par un moteur comme par un lecteur d'écran sans
              interaction préalable. Un accordéon replié n'est pas un problème
              d'indexation, mais il en devient un s'il est monté côté client. */}
          <dl className="flex flex-col gap-8">
            {editorial.faq.map((item) => (
              <div key={item.question}>
                <dt>
                  <h3 className="text-base font-semibold text-stone-900 mb-2">
                    {item.question}
                  </h3>
                </dt>
                <dd className="text-base leading-relaxed text-stone-700">
                  {item.answer}
                </dd>
              </div>
            ))}
          </dl>
        </div>
      )}
    </section>
  )
}
