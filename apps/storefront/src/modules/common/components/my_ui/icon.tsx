import clsx from "clsx"
import type { HTMLAttributes } from "react"
import { iconCollections } from "./icons.data"

/**
 * Icône rendue en SVG inline, **sans runtime**.
 *
 * Volontairement dans son propre module, et sans `"use client"` : `my_ui/index`
 * porte cette directive, donc tout composant serveur qui y importait `Icon`
 * (Banner, Footer, Nav…) basculait dans le graphe client et embarquait
 * `@iconify/react` — ~18 Ko de JS à parser et hydrater à chaque chargement,
 * pour dessiner des icônes qui ne changent jamais.
 *
 * Les corps SVG vivent déjà dans `icons.data.ts` : il n'y a rien à calculer au
 * runtime, le serveur peut émettre le `<svg>` final directement. Un composant
 * client peut continuer à importer ce module — il y gagne aussi, le rendu ne
 * coûtant plus que du JSX.
 */

type IconProps = Omit<HTMLAttributes<HTMLSpanElement>, "color"> & {
  name: string
  library?: string
  size?: number
  strokeWidth?: number
  color?: string
}

type ResolvedIcon = { body: string; width: number; height: number }

/**
 * Résout `library:name` dans les collections générées, en suivant les alias
 * (`home` → `house`). Renvoie `null` si l'icône est absente.
 */
function resolveIcon(library: string, name: string): ResolvedIcon | null {
  const collection = iconCollections.find((c) => c.prefix === library)
  if (!collection) return null

  const target = collection.aliases?.[name]?.parent ?? name
  const icon = collection.icons?.[target]
  if (!icon?.body) return null

  return {
    body: icon.body,
    width: icon.width ?? collection.width ?? 24,
    height: icon.height ?? collection.height ?? 24,
  }
}

export function Icon({
  name,
  library = "lucide",
  size = 20,
  strokeWidth,
  color,
  className,
  ...props
}: IconProps) {
  const icon = resolveIcon(library, name)

  return (
    <span
      className={clsx("inline-flex items-center justify-center", className)}
      {...props}
    >
      {/* Une icône introuvable laisse un `<svg>` vide plutôt que rien : le
          gabarit garde ses dimensions, donc aucun décalage de mise en page.
          (L'ancien composant retombait sur l'API réseau d'iconify ; ce module
          est hors ligne par construction — d'où l'audit des noms utilisés.) */}
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width={size}
        height={size}
        viewBox={`0 0 ${icon?.width ?? 24} ${icon?.height ?? 24}`}
        aria-hidden="true"
        role="img"
        style={{
          ...(color ? { color } : null),
          ...(strokeWidth
            ? ({ "--stroke-width": strokeWidth } as React.CSSProperties)
            : null),
        }}
        // Contenu issu d'un fichier généré et versionné (scripts/generate-icons.mjs),
        // jamais d'une saisie utilisateur : pas de surface d'injection ici.
        dangerouslySetInnerHTML={{ __html: icon?.body ?? "" }}
      />
    </span>
  )
}

export default Icon
