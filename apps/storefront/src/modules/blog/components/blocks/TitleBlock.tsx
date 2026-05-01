import type { TitleBlock as TTitleBlock } from "@lib/blog/types"

const styles: Record<number, string> = {
  1: "text-3xl md:text-4xl text-ui-fg-base font-normal leading-tight mt-10 mb-5",
  2: "text-xl md:text-2xl text-ui-fg-base font-normal leading-snug mt-10 mb-4 pb-3 border-b border-ui-border-base",
  3: "text-base font-semibold text-ui-fg-subtle uppercase tracking-widest mt-8 mb-3",
}

export default function TitleBlock({ level = 2, text }: TTitleBlock) {
  const Tag = `h${level}` as "h1" | "h2" | "h3"
  return <Tag className={styles[level] ?? styles[2]}>{text}</Tag>
}
