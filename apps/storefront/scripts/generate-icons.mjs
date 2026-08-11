// Génère un sous-ensemble compact des icônes iconify réellement utilisées, pour
// NE PAS embarquer les jeux complets (@iconify-json/*, ~800 kB) dans le bundle.
//
// Usage : depuis apps/storefront →  node scripts/generate-icons.mjs
// Après avoir ajouté une nouvelle icône dans le code, ajoute son nom ci-dessous
// puis relance ce script. (Une icône absente d'ici reste affichable via le
// fallback API d'iconify, mais elle ne sera pas bundlée.)
//
// Sortie : src/modules/common/components/my_ui/icons.data.ts (fichier généré,
// à commiter, à ne pas éditer à la main).

import fs from "node:fs"
import path from "node:path"
import { fileURLToPath } from "node:url"
import { createRequire } from "node:module"

const require = createRequire(import.meta.url)
const __dirname = path.dirname(fileURLToPath(import.meta.url))
const OUT = path.resolve(
  __dirname,
  "../src/modules/common/components/my_ui/icons.data.ts"
)

/** Icônes utilisées, par collection. Recensées depuis le code (Icon/Button/Input). */
const USED = {
  lucide: [
    "arrow-right", "chevron-left", "chevron-right", "chevron-down",
    "umbrella", "letter-text", "user-round", "shopping-cart", "home", "mail",
    "menu", "package", "leaf", "hand-heart", "instagram", "facebook",
    "youtube", "palette", "layers", "sparkles", "pen-line", "settings-2",
    "search", "cookie",
  ],
  hugeicons: ["chopsticks"],
  "lucide-lab": ["fan-handheld"],
}

let getIcons
try {
  ;({ getIcons } = require("@iconify/utils"))
} catch {
  /* fallback manuel ci-dessous */
}

/** Repli si @iconify/utils absent : extrait icônes + alias (et leur parent). */
function manualSubset(full, names) {
  const icons = {}
  const aliases = {}
  for (const n of names) {
    if (full.icons?.[n]) {
      icons[n] = full.icons[n]
    } else if (full.aliases?.[n]) {
      aliases[n] = full.aliases[n]
      const parent = full.aliases[n].parent
      if (parent && full.icons?.[parent]) icons[parent] = full.icons[parent]
    } else {
      console.warn(`  ⚠ introuvable : ${full.prefix}:${n}`)
    }
  }
  const out = { prefix: full.prefix, icons }
  if (Object.keys(aliases).length) out.aliases = aliases
  if (full.width != null) out.width = full.width
  if (full.height != null) out.height = full.height
  return out
}

const collections = []
for (const [prefix, names] of Object.entries(USED)) {
  const full = require(`@iconify-json/${prefix}/icons.json`)
  const subset = getIcons ? getIcons(full, names) : manualSubset(full, names)
  const count = Object.keys(subset.icons ?? {}).length
  console.log(`  ${prefix}: ${count} icône(s)`) // eslint-disable-line no-console
  collections.push(subset)
}

const header =
  "// FICHIER GÉNÉRÉ par scripts/generate-icons.mjs — ne pas éditer à la main.\n" +
  "// Sous-ensemble compact des icônes iconify utilisées (voir USED dans le script).\n" +
  "// Régénérer après ajout d'une icône : node scripts/generate-icons.mjs\n\n"
const body =
  "// eslint-disable-next-line @typescript-eslint/no-explicit-any\n" +
  `export const iconCollections: any[] = ${JSON.stringify(collections)}\n`

fs.writeFileSync(OUT, header + body)
console.log(`✓ ${path.relative(process.cwd(), OUT)} généré`) // eslint-disable-line no-console
