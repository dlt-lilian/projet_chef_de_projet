/**
 * Vocabulaire des étapes de fabrication, partagé par le back (routes,
 * subscriber, scripts) et le widget admin.
 *
 * Ce fichier ne doit dépendre de RIEN : il est bundlé dans le dashboard, où le
 * moindre import serveur casserait la compilation.
 */

export const STAGES = [
  { value: "ordered", label: "Commandé" },
  { value: "in_production", label: "En cours de fabrication" },
  { value: "shipping", label: "En cours d'expédition" },
  { value: "shipped", label: "Expédié" },
  { value: "delivered", label: "Livré" },
] as const

export type Stage = (typeof STAGES)[number]["value"]

/**
 * Étape implicite de toute commande : une commande qui vient d'être passée est,
 * de fait, « Commandé ».
 */
export const DEFAULT_STAGE: Stage = "ordered"

export function isStage(value: unknown): value is Stage {
  return STAGES.some((s) => s.value === value)
}

export function labelOf(stage: Stage): string {
  return STAGES.find((s) => s.value === stage)!.label
}
