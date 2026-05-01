import type { TextBlock as TTextBlock } from "@lib/blog/types"

export default function TextBlock({ content, dropcap }: TTextBlock) {
  return (
    <div
      className={[
        "text-base text-ui-fg-subtle leading-relaxed mb-6",
        dropcap
          ? "first-letter:float-left first-letter:text-6xl first-letter:font-light first-letter:mr-2 first-letter:mt-1 first-letter:text-ui-fg-base first-letter:leading-none"
          : "",
      ]
        .filter(Boolean)
        .join(" ")}
      dangerouslySetInnerHTML={{ __html: content }}
    />
  )
}
