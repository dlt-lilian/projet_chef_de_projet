import type { TableBlock as TTableBlock } from "@lib/blog/types"

const CELL = "px-4 py-3 align-top text-left"

export default function TableBlock({ headers, rows, caption, firstColHeader }: TTableBlock) {
  const safeHeaders = Array.isArray(headers) ? headers : []
  const safeRows    = Array.isArray(rows)    ? rows.filter(Array.isArray) : []

  // En-têtes toutes vides : le tableau est rendu sans <thead> (grille simple).
  const hasHeader = safeHeaders.some(h => h?.trim())
  if (!hasHeader && safeRows.length === 0) return null

  return (
    <figure className="my-10">
      {/* Le tableau déborde sur mobile : on le fait défiler plutôt que de le
          comprimer, la colonne de l'article restant à sa largeur. */}
      <div className="overflow-x-auto rounded-lg border border-ui-border-base">
        <table className="w-full text-sm border-collapse">
          {hasHeader && (
            <thead>
              <tr className="bg-ui-bg-subtle">
                {safeHeaders.map((h, c) => (
                  <th
                    key={c}
                    scope="col"
                    className={`${CELL} font-medium text-ui-fg-base border-b border-ui-border-base`}
                    dangerouslySetInnerHTML={{ __html: h ?? "" }}
                  />
                ))}
              </tr>
            </thead>
          )}
          <tbody>
            {safeRows.map((row, r) => (
              <tr key={r} className="border-b border-ui-border-base last:border-b-0">
                {row.map((cell, c) =>
                  firstColHeader && c === 0 ? (
                    <th
                      key={c}
                      scope="row"
                      className={`${CELL} font-medium text-ui-fg-base whitespace-nowrap`}
                      dangerouslySetInnerHTML={{ __html: cell ?? "" }}
                    />
                  ) : (
                    <td
                      key={c}
                      className={`${CELL} text-ui-fg-subtle leading-relaxed`}
                      dangerouslySetInnerHTML={{ __html: cell ?? "" }}
                    />
                  )
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {caption && (
        <figcaption className="mt-3 text-xs text-ui-fg-muted tracking-wide text-center">
          {caption}
        </figcaption>
      )}
    </figure>
  )
}
