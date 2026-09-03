import type { TitleBlock as TTitleBlock } from "@lib/blog/types"

const styles: Record<number, string> = {
  1: "text-3xl md:text-4xl text-ui-fg-base font-normal leading-tight mt-10 mb-5",
  2: "text-xl md:text-2xl text-ui-fg-base font-normal leading-snug mt-10 mb-4 pb-3 border-b border-ui-border-base",
  3: "text-base font-semibold text-ui-fg-subtle uppercase tracking-widest mt-8 mb-3",
}

export default function TitleBlock({ level = 2, text }: TTitleBlock) {
  // Un bloc « titre » de niveau 1 rend un <h2>, jamais un <h1>.
  //
  // Le H1 d'une page est son titre, rendu une seule fois par ArticleTemplate.
  // Un intertitre de corps de texte ne peut pas l'être : deux <h1> dans un
  // article, c'est ce que produisait l'ancien comportement dès qu'un rédacteur
  // choisissait le niveau 1 dans le backoffice.
  //
  // Le STYLE du niveau 1 est conservé — l'apparence ne change pas, seule la
  // balise change.
  const tag = level === 1 ? "h2" : (`h${level}` as "h2" | "h3")
  const Tag = tag
  return <Tag className={styles[level] ?? styles[2]}>{text}</Tag>
}
