import React from "react"

/**
 * Injecte un ou plusieurs blocs de données structurées Schema.org.
 *
 * Server Component : le `<script type="application/ld+json">` est rendu côté
 * serveur, donc présent dès le HTML initial (indispensable pour que Google le
 * lise au crawl, sans dépendre de l'hydratation).
 */
export default function JsonLd({
  data,
}: {
  data: Record<string, unknown> | Record<string, unknown>[]
}) {
  const blocks = Array.isArray(data) ? data : [data]

  return (
    <>
      {blocks.map((block, i) => (
        <script
          key={i}
          type="application/ld+json"
          // Le contenu est construit côté serveur à partir de nos données
          // (jamais de saisie utilisateur brute) → pas de risque d'injection.
          dangerouslySetInnerHTML={{ __html: JSON.stringify(block) }}
        />
      ))}
    </>
  )
}
