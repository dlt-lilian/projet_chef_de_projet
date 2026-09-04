import type {
  ConfigurableHandle,
  ConfiguratorChoice,
  ConfiguratorColorOption,
  ConfiguratorOption,
  ConfiguratorProductConfig,
  ConfiguratorTextureOption,
} from "./configurableProducts"

/**
 * Déclinaisons : quelles options du configurateur deviennent des cartes
 * distinctes en boutique.
 *
 * Le produit cartésien complet est hors de question — 5×3×8×3×5 = 1 800
 * combinaisons pour la seule ombrelle. On décline donc sur DEUX axes, les seuls
 * qui se lisent sur une vignette : la couleur et le motif. Les autres options
 * (essence du bois, finition métal, gravure) gardent leur valeur par défaut et
 * restent entièrement modifiables sur la fiche. Une déclinaison est un point
 * d'entrée dans le configurateur, pas un produit figé.
 *
 * Les ids sont ceux de la section Configurateur de l'admin, où ils sont
 * modifiables — d'où le repli par `type` de `resolveVariantAxes`, et le fait
 * que l'absence d'axe ne casse rien : le produit garde alors sa carte unique.
 *
 * ⚠️ Le repli ne peut pas deviner l'intention : l'ombrelle a trois options de
 * type `color` (poignée, toile, métal) et le repli prendrait la première.
 * Renommer un axe en admin impose donc de corriger la table ci-dessous.
 */
export const VARIANT_AXES: Record<
  ConfigurableHandle,
  { color: string; motif: string }
> = {
  ombrelle: { color: "couleur-toile", motif: "degrade" },
  baguettes: { color: "bois-laquee", motif: "motifs" },
  eventail: { color: "papier-color", motif: "papier-motif" },
}

/** Paramètre d'URL portant la déclinaison : `/products/ombrelle?v=rouge__degrade`. */
export const VARIANT_PARAM = "v"

/** Séparateur des deux axes dans le paramètre d'URL et dans la clé. */
const SEPARATOR = "__"

/** Option porteuse de choix (tout sauf la gravure, qui est un champ libre). */
type ChoiceOption = ConfiguratorTextureOption | ConfiguratorColorOption

function hasChoices(option: ConfiguratorOption): option is ChoiceOption {
  return option.type !== "engraving"
}

/**
 * Un choix retenu sur un axe, aplati pour l'affichage d'une carte.
 * `priceDelta` est en CENTIMES, comme partout dans le configurateur.
 */
export type VariantAxisChoice = {
  optionId: string
  optionLabel: string
  choiceId: string
  label: string
  colorHex?: string
  texturePath?: string
  priceDelta: number
}

export type VariantCombination = {
  /** Clé stable : `<handle>__<couleur>__<motif>`. Sert de clé React, de nom de fichier de vignette et de base au paramètre d'URL. */
  key: string
  handle: ConfigurableHandle
  /** Valeur du paramètre `v` : `<couleur>__<motif>`. */
  param: string
  color: VariantAxisChoice
  /** `null` quand le produit n'a pas d'axe motif exploitable. */
  motif: VariantAxisChoice | null
  /** Suffixe de titre lisible : « Rouge » ou « Rouge · Dégradé ». */
  label: string
  /** Supplément total de la déclinaison, EN CENTIMES. */
  priceDelta: number
  /** Sélections à injecter dans le configurateur à l'ouverture de la fiche. */
  selections: Record<string, string>
}

/**
 * Un motif « neutre » (« Aucun », « none ») ne porte ni texture ni couleur : la
 * déclinaison est alors la version unie, et son libellé ne mentionne pas le
 * motif. Se reconnaître à la donnée plutôt qu'à l'id évite de dépendre d'un
 * libellé saisi en admin.
 */
function isNeutralChoice(choice: ConfiguratorChoice): boolean {
  return !choice.texturePath && !choice.colorHex
}

function toAxisChoice(
  option: ChoiceOption,
  choice: ConfiguratorChoice
): VariantAxisChoice {
  return {
    optionId: option.id,
    optionLabel: option.label,
    choiceId: choice.id,
    label: choice.label,
    colorHex: choice.colorHex,
    texturePath: choice.texturePath,
    priceDelta: choice.priceDelta ?? 0,
  }
}

/**
 * Retrouve les deux options servant d'axes. L'axe couleur est obligatoire :
 * sans lui il n'y a pas de déclinaison, et le produit reste une carte unique.
 */
export function resolveVariantAxes(
  handle: string,
  config: ConfiguratorProductConfig | undefined | null
): { color: ChoiceOption; motif: ChoiceOption | null } | null {
  if (!config?.options?.length) {
    return null
  }

  const declared = VARIANT_AXES[handle as ConfigurableHandle]
  const options = config.options.filter(hasChoices)

  const color =
    options.find((o) => o.id === declared?.color) ??
    options.find((o) => o.type === "color") ??
    null

  if (!color?.choices?.length) {
    return null
  }

  const motif =
    options.find((o) => o.id === declared?.motif) ??
    options.find((o) => o.type === "motif") ??
    null

  return { color, motif: motif?.choices?.length ? motif : null }
}

/**
 * Toutes les déclinaisons d'un produit : couleur × motif.
 * 8 × 3 pour l'ombrelle et l'éventail, 8 × 6 pour les baguettes.
 */
export function listVariantCombinations(
  handle: string,
  config: ConfiguratorProductConfig | undefined | null
): VariantCombination[] {
  const axes = resolveVariantAxes(handle, config)
  if (!axes) {
    return []
  }

  const motifChoices = axes.motif?.choices ?? [null]

  return axes.color.choices.flatMap((colorChoice) =>
    motifChoices.map((motifChoice) => {
      const color = toAxisChoice(axes.color, colorChoice)
      const motif =
        motifChoice && axes.motif
          ? toAxisChoice(axes.motif, motifChoice)
          : null

      const param = motif
        ? `${color.choiceId}${SEPARATOR}${motif.choiceId}`
        : color.choiceId

      const selections: Record<string, string> = {
        [color.optionId]: color.choiceId,
      }
      if (motif) {
        selections[motif.optionId] = motif.choiceId
      }

      return {
        key: `${handle}${SEPARATOR}${param}`,
        handle: handle as ConfigurableHandle,
        param,
        color,
        motif,
        label:
          motif && !isNeutralChoice(motifChoice!)
            ? `${color.label} · ${motif.label}`
            : color.label,
        priceDelta: color.priceDelta + (motif?.priceDelta ?? 0),
        selections,
      }
    })
  )
}

/**
 * Relit le paramètre `v` d'une fiche produit.
 *
 * Renvoie `null` si la déclinaison ne correspond à rien de connu — un lien
 * périmé après modification de la config en admin doit ouvrir la fiche sur ses
 * valeurs par défaut, jamais planter ni afficher un choix qui n'existe plus.
 */
export function parseVariantParam(
  handle: string,
  config: ConfiguratorProductConfig | undefined | null,
  value: string | undefined
): VariantCombination | null {
  if (!value) {
    return null
  }
  return (
    listVariantCombinations(handle, config).find((c) => c.param === value) ??
    null
  )
}
