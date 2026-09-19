import { useEffect, useState } from "react"

/**
 * Couleurs des graphiques.
 *
 * Recharts peint en SVG : il lui faut des valeurs concrètes, les variables CSS
 * de Medusa (`--ui-fg-muted`…) ne sont pas résolues dans un attribut de
 * présentation. Les deux thèmes sont donc écrits en dur, et choisis — pas
 * « inversés » automatiquement — contre la surface réelle de la tuile
 * (`bg-ui-bg-subtle`, #fafafa en clair, #18181b en sombre).
 *
 * Une seule teinte : chaque graphique ne porte qu'une série, la couleur n'a
 * aucune identité à distinguer. L'entonnoir est une échelle ordinale (même
 * teinte, clair → foncé) parce que ses barres sont des étapes ordonnées.
 *
 * Contrastes vérifiés au validateur du kit dataviz : accent ≥ 3:1 sur les deux
 * surfaces ; rampes ordinales monotones, écart de luminosité ≥ 0,06 entre
 * étapes, extrémité claire à 2,02:1 (clair) et 3,28:1 (sombre).
 */
export type ChartTheme = {
  accent: string
  accentSoft: string
  ordinal: [string, string, string, string]
  grid: string
  axis: string
  track: string
}

const LIGHT: ChartTheme = {
  accent: "#2a78d6",
  accentSoft: "rgba(42, 120, 214, 0.14)",
  ordinal: ["#86b6ef", "#5598e7", "#2a78d6", "#1c5cab"],
  grid: "#e4e4e7",
  axis: "#52525b",
  track: "#f0f0f1",
}

const DARK: ChartTheme = {
  accent: "#3987e5",
  accentSoft: "rgba(57, 135, 229, 0.20)",
  ordinal: ["#b7d3f6", "#86b6ef", "#5598e7", "#256abf"],
  grid: "rgba(255, 255, 255, 0.08)",
  axis: "#a1a1aa",
  track: "rgba(255, 255, 255, 0.06)",
}

const isDarkNow = (): boolean =>
  typeof document !== "undefined" &&
  document.documentElement.classList.contains("dark")

/**
 * Le dashboard Medusa pose la classe `dark` sur `<html>` (bascule manuelle ou
 * préférence système) : on l'observe pour repeindre les graphiques sans recharger.
 */
export function useChartTheme(): ChartTheme {
  const [dark, setDark] = useState(isDarkNow)

  useEffect(() => {
    const root = document.documentElement
    const observer = new MutationObserver(() => setDark(isDarkNow()))
    observer.observe(root, { attributes: true, attributeFilter: ["class"] })
    return () => observer.disconnect()
  }, [])

  return dark ? DARK : LIGHT
}
