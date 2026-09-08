import type { Block } from "./types"

/**
 * Extrait les paires question/réponse d'un article rédigé avec les blocs
 * existants.
 *
 * POURQUOI PAS UN BLOC « faq » DÉDIÉ. Les FAQ des pages de catégorie sont
 * parties au blog le 2026-09-08 (cf. `lib/content/categories.ts`), où elles
 * perdaient leur `FAQPage` — les catégories l'émettaient, pas les articles.
 * Ajouter un type de bloc aurait imposé de toucher le schéma, le renderer ET
 * le BlockBuilder du backoffice, pour un balisage que la convention du site
 * pose déjà ailleurs (fiches produit, landings d'occasion).
 *
 * La convention retenue est donc typographique : un H2 « Questions fréquentes »,
 * puis un H3 par question suivi de son ou ses paragraphes. C'est exactement la
 * mise en forme qu'un rédacteur produirait de lui-même dans le backoffice, et
 * elle reste modifiable sans passer par le code.
 *
 * Le balisage suit ce qui est RÉELLEMENT rendu : pas de section reconnue → pas
 * de `FAQPage`. Google invalide un `FAQPage` dont les réponses ne sont pas
 * visibles sur la page ; ici elles le sont forcément, puisqu'elles viennent
 * des blocs affichés.
 */

/** Titre de section qui ouvre une FAQ. Casse et accents indifférents. */
const FAQ_HEADING = "questions frequentes"

function normalize(value: string): string {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
}

/**
 * HTML → texte brut.
 *
 * Les blocs « texte » stockent du HTML (`<p>`, `<strong>`, `<a>`…). Le champ
 * `text` d'une `Answer` schema.org accepte un sous-ensemble de balises, mais
 * les valeurs du reste du site sont en texte brut : on s'aligne dessus plutôt
 * que de faire coexister deux formats dans le même JSON-LD.
 */
function toPlainText(html: string): string {
  return html
    .replace(/<\/(p|div|li|h[1-6])>/gi, " ")
    .replace(/<br\s*\/?>/gi, " ")
    .replace(/<[^>]+>/g, "")
    // Entités numériques (&#233; / &#xE9;) : ce qu'un copier-coller depuis un
    // traitement de texte laisse le plus souvent dans le champ HTML du
    // backoffice. Les entités nommées, elles, se limitent aux cinq du XML —
    // embarquer la table complète pour décoder un `&eacute;` que personne ne
    // saisit à la main coûterait plus cher que le cas qu'il couvre.
    .replace(/&#(\d+);/g, (_, code) => String.fromCodePoint(Number(code)))
    .replace(/&#x([0-9a-f]+);/gi, (_, code) => String.fromCodePoint(parseInt(code, 16)))
    .replace(/&nbsp;/g, " ")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    // En dernier : décoder `&amp;` plus tôt transformerait `&amp;lt;` en `<`.
    .replace(/&amp;/g, "&")
    .replace(/\s+/g, " ")
    .trim()
}

export function extractFaqFromBlocks(
  blocks: Block[]
): { question: string; answer: string }[] {
  if (!Array.isArray(blocks)) return []

  const start = blocks.findIndex(
    (b) => b.type === "titre" && normalize(b.text) === FAQ_HEADING
  )
  if (start === -1) return []

  const items: { question: string; answer: string }[] = []
  let current: { question: string; answers: string[] } | null = null

  const flush = () => {
    if (!current) return
    const answer = current.answers.join(" ").trim()
    // Une question sans réponse rendue ne serait pas un rich result valide.
    if (current.question && answer) {
      items.push({ question: current.question, answer })
    }
    current = null
  }

  for (const block of blocks.slice(start + 1)) {
    if (block.type === "titre") {
      // Un titre de niveau supérieur ou égal au H2 ferme la FAQ : la section
      // suivante n'en fait plus partie.
      if (block.level <= 2) break
      flush()
      current = { question: block.text.trim(), answers: [] }
      continue
    }

    if (block.type === "texte" && current) {
      const text = toPlainText(block.content)
      if (text) current.answers.push(text)
      continue
    }

    // Tout autre bloc (image, tableau…) interrompt la réponse en cours sans
    // fermer la FAQ : le H3 suivant ouvrira simplement la question suivante.
  }

  flush()
  return items
}
