// Formatage partagé par les tuiles, les courbes et l'entonnoir.

export type Granularity = "day" | "week"

export const formatMoney = (
  value: number | null,
  currency: string
): string => {
  if (value == null) return "—"
  try {
    return new Intl.NumberFormat("fr-FR", {
      style: "currency",
      currency: currency.toUpperCase(),
    }).format(value)
  } catch {
    return `${value.toFixed(2)} ${currency.toUpperCase()}`
  }
}

/** Graduations de l'axe : « 1,2 k€ » plutôt que « 1 234,00 € ». */
export const formatCompactMoney = (
  value: number,
  currency: string
): string => {
  try {
    return new Intl.NumberFormat("fr-FR", {
      style: "currency",
      currency: currency.toUpperCase(),
      notation: "compact",
      maximumFractionDigits: 1,
    }).format(value)
  } catch {
    return String(value)
  }
}

export const formatPercent = (value: number | null, digits = 1): string =>
  value == null ? "—" : `${(value * 100).toFixed(digits)} %`

export const formatDateTime = (iso: string): string =>
  new Date(iso).toLocaleString("fr-FR", {
    dateStyle: "short",
    timeStyle: "short",
  })

// Les clés de seau sont des dates locales « YYYY-MM-DD » : sans suffixe `Z`,
// elles se relisent dans le fuseau du navigateur, celui qui a servi à les créer.
const parseBucket = (bucket: string): Date => new Date(`${bucket}T00:00:00`)

/** Graduation d'axe : court, il y en a beaucoup. */
export const formatBucketTick = (bucket: string): string =>
  parseBucket(bucket).toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "2-digit",
  })

/** Infobulle : explicite, il n'y en a qu'une à la fois. */
export const formatBucketLabel = (
  bucket: string,
  granularity: Granularity
): string => {
  const date = parseBucket(bucket)
  if (granularity === "week") {
    return `Semaine du ${date.toLocaleDateString("fr-FR", {
      day: "numeric",
      month: "long",
      year: "numeric",
    })}`
  }
  return date.toLocaleDateString("fr-FR", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  })
}
