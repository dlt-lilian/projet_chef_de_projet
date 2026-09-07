/**
 * Événements e-commerce GA4 — vocabulaire, mise en forme, émission.
 *
 * Complément de `analytics.ts`, qui se borne à POSER la balise : ici vivent les
 * huit événements de l'entonnoir d'achat, ceux dont GA4 tire nativement les
 * rapports « Monétisation » et le taux de conversion. Sans eux la propriété ne
 * mesure que du trafic — combien de visites, mais ni panier moyen, ni étape de
 * décrochage, ni produit qui vend réellement.
 *
 * Trois garde-fous vivent ICI plutôt que dans les composants appelants, pour
 * qu'aucun point d'émission ne puisse les oublier :
 *
 *  1. CONSENTEMENT relu à CHAQUE envoi, à la source (le cookie) et non via le
 *     contexte React. Retirer son accord démonte la balise mais laisse
 *     `window.gtag` en mémoire (cf. `use-google-consent`) : un envoi partirait
 *     encore. La lecture est un simple parcours de `document.cookie`, sans
 *     commune mesure avec l'aller-retour réseau qu'elle évite.
 *  2. FILE D'ATTENTE : la balise est chargée en `afterInteractive`, donc APRÈS
 *     l'hydratation. Un événement émis au montage d'une page part avant que
 *     `window.gtag` n'existe et serait perdu EN SILENCE — soit exactement
 *     `view_item`, `view_cart`, `begin_checkout` et `purchase`, c'est-à-dire
 *     les deux bouts de l'entonnoir. Ils sont donc mis en attente, puis vidés
 *     par `flushAnalyticsQueue` quand la balise s'exécute.
 *  3. DOUBLONS D'ACHAT : la page de confirmation est rechargeable, et son lien
 *     survit dans l'historique comme dans l'e-mail de commande. Sans mémoire,
 *     chaque F5 regonflerait le chiffre d'affaires.
 *
 * MONTANTS : Medusa v2 expose des montants DÉCIMAUX (`25.5` = 25,50 €), pas des
 * centimes — c'est ce que `convertToLocale` reçoit tel quel dans tout le
 * storefront. Ils partent donc bruts vers GA4, qui attend la même convention.
 * Seul le configurateur manipule des centimes, dans ses propres constantes de
 * suppléments (`computeConfiguratorSurcharge`), et ne sert pas de source ici.
 */

import { HttpTypes } from "@medusajs/types"

import { USE_GA_DIRECT, USE_GTM } from "./analytics"
import { readConsentCookie } from "./cookie-consent"

/**
 * Les huit événements de l'entonnoir. Noms RÉSERVÉS par GA4 : les écrire
 * autrement (`addToCart`, `purchase_complete`…) produirait des événements
 * personnalisés, absents des rapports Monétisation et sans valeur monétaire
 * reconnue. Le typage ferme la porte aux fautes de frappe.
 */
export type EcommerceEventName =
  | "view_item"
  | "add_to_cart"
  | "remove_from_cart"
  | "view_cart"
  | "begin_checkout"
  | "add_shipping_info"
  | "add_payment_info"
  | "purchase"

/** Article au format attendu par GA4 (schéma « items »). */
export type AnalyticsItem = {
  item_id: string
  item_name: string
  item_variant?: string
  item_category?: string
  price?: number
  quantity?: number
}

export type EcommercePayload = {
  currency?: string
  value?: number
  items: AnalyticsItem[]
  /** Champs propres à un événement : `transaction_id`, `shipping_tier`… */
  [key: string]: unknown
}

/* ────────────────────────── Mise en forme des articles ───────────────────── */

/**
 * GA4 attend un code en minuscules. Medusa les stocke déjà ainsi ; on normalise
 * quand même, car la devise pilote l'agrégation du chiffre d'affaires : une
 * casse divergente produirait deux colonnes au lieu d'une.
 */
const currency = (code: string | undefined) => (code ?? "eur").toLowerCase()

/**
 * Ligne de panier OU de commande — les deux types exposent les mêmes champs
 * dénormalisés (`product_title`, `variant_sku`, `unit_price`…), Medusa les
 * recopiant sur la ligne au moment de l'ajout. Un seul mappeur suffit donc, et
 * il reste juste même si le produit d'origine a changé de nom depuis.
 */
type TrackableLine = {
  quantity: number
  unit_price: number
  variant_sku?: string | null
  variant_id?: string | null
  variant_title?: string | null
  product_title?: string | null
  product_collection?: string | null
  title?: string | null
}

/**
 * `item_id` doit rester STABLE d'un événement à l'autre : c'est la clé de
 * rapprochement entre `view_item`, `add_to_cart` et `purchase`. On privilégie
 * le SKU — lisible dans les rapports, aligné sur le catalogue — puis
 * l'identifiant de variante. Jamais celui de la ligne de panier : il change à
 * chaque ajout et casserait tout rapprochement.
 */
export function itemFromLine(line: TrackableLine): AnalyticsItem {
  return {
    item_id: line.variant_sku || line.variant_id || "",
    item_name: line.product_title || line.title || "",
    item_variant: line.variant_title ?? undefined,
    item_category: line.product_collection ?? undefined,
    price: line.unit_price,
    quantity: line.quantity,
  }
}

type PricedVariant = HttpTypes.StoreProductVariant & {
  calculated_price?: { calculated_amount?: number; currency_code?: string }
}

function cheapestVariant(
  product: HttpTypes.StoreProduct
): PricedVariant | undefined {
  const priced = ((product.variants ?? []) as PricedVariant[]).filter(
    (variant) => typeof variant.calculated_price?.calculated_amount === "number"
  )

  return priced.sort(
    (a, b) =>
      (a.calculated_price?.calculated_amount ?? 0) -
      (b.calculated_price?.calculated_amount ?? 0)
  )[0]
}

/**
 * Article construit depuis la fiche produit, avant tout passage en panier.
 *
 * La variante est facultative : sur une fiche à plusieurs déclinaisons, rien
 * n'est encore choisi à l'affichage. On prend alors la MOINS CHÈRE, qui est le
 * prix affiché par `ProductPrice` (« À partir de ») — `view_item` et la page
 * annoncent ainsi le même montant.
 */
export function itemFromProduct(
  product: HttpTypes.StoreProduct,
  variant?: HttpTypes.StoreProductVariant,
  quantity = 1
): AnalyticsItem {
  const priced = (variant ?? cheapestVariant(product)) as
    | PricedVariant
    | undefined

  return {
    item_id: priced?.sku || priced?.id || product.id,
    item_name: product.title,
    item_variant: priced?.title ?? undefined,
    item_category:
      product.collection?.title ?? product.categories?.[0]?.name ?? undefined,
    price: priced?.calculated_price?.calculated_amount,
    quantity,
  }
}

/** Devise d'un produit, lue sur sa variante tarifée : le produit n'en porte pas. */
export function currencyForProduct(
  product: HttpTypes.StoreProduct,
  variant?: HttpTypes.StoreProductVariant
): string {
  const priced = (variant ?? cheapestVariant(product)) as
    | PricedVariant
    | undefined

  return currency(priced?.calculated_price?.currency_code)
}

/**
 * Événement à un seul article, construit depuis la fiche produit — l'ajout au
 * panier, qu'il vienne du bouton standard ou du configurateur.
 *
 * `value` est le montant AJOUTÉ (prix unitaire × quantité), et non le prix
 * unitaire seul : c'est ce que GA4 additionne pour mesurer ce que la fiche
 * pousse réellement vers le panier.
 */
export function payloadFromProduct(
  product: HttpTypes.StoreProduct,
  variant?: HttpTypes.StoreProductVariant,
  quantity = 1
): EcommercePayload {
  const item = itemFromProduct(product, variant, quantity)

  return {
    currency: currencyForProduct(product, variant),
    value: (item.price ?? 0) * quantity,
    items: [item],
  }
}

/**
 * Panier complet — sert à `view_cart` et `begin_checkout`.
 *
 * `value` = SOUS-TOTAL des articles, hors frais de port et hors taxes. C'est la
 * définition Google pour ces deux étapes : y verser le total TTC gonflerait le
 * haut de l'entonnoir par rapport à `purchase`, dont la valeur suit une autre
 * règle (voir ci-dessous), et rendrait les deux chiffres incomparables.
 */
export function payloadFromCart(cart: HttpTypes.StoreCart): EcommercePayload {
  return {
    currency: currency(cart.currency_code),
    value: cart.item_subtotal ?? cart.subtotal ?? cart.total ?? 0,
    items: (cart.items ?? []).map(itemFromLine),
  }
}

/**
 * Commande payée.
 *
 * `value` = TOTAL réellement encaissé, port et taxes compris : c'est le chiffre
 * d'affaires des rapports GA4, il doit correspondre à l'encaissement Stripe.
 * `shipping` et `tax` sont fournis à part pour que GA4 puisse les isoler.
 *
 * `transaction_id` porte l'identifiant technique de la commande, et non le
 * `display_id` : c'est la clé de déduplication de GA4, elle doit être unique et
 * ne jamais être réattribuée.
 */
export function payloadFromOrder(
  order: HttpTypes.StoreOrder
): EcommercePayload {
  return {
    transaction_id: order.id,
    currency: currency(order.currency_code),
    value: order.total ?? 0,
    tax: order.tax_total ?? 0,
    shipping: order.shipping_total ?? 0,
    items: (order.items ?? []).map(itemFromLine),
  }
}

/* ─────────────────────────────── Émission ────────────────────────────────── */

/**
 * Au-delà, les plus ANCIENS sont abandonnés : si la balise ne se charge jamais
 * (bloqueur de publicité, réseau coupé), la file ne doit pas croître sans fin
 * pendant toute la session. Le plafond est large — quelques événements suffisent
 * à couvrir le délai réel entre hydratation et `afterInteractive`.
 */
const MAX_QUEUED_EVENTS = 20

type QueuedEvent = { name: EcommerceEventName; payload: EcommercePayload }

let queue: QueuedEvent[] = []

/** Une balise est-elle seulement configurée ? Sinon, inutile d'empiler. */
const TAGGING_ENABLED = USE_GTM || USE_GA_DIRECT

const analyticsAllowed = () => readConsentCookie()?.analytics === true

/** La balise a défini ses globales : les envois peuvent partir. */
const taggingReady = () =>
  typeof window !== "undefined" && typeof window.gtag === "function"

function dispatch(name: EcommerceEventName, payload: EcommercePayload): void {
  if (USE_GTM) {
    // Motif documenté par Google pour GTM : remettre `ecommerce` à `null` AVANT
    // de pousser. Sans ça le conteneur fusionne les objets successifs, et les
    // articles d'un événement précédent se retrouvent recollés au suivant.
    window.dataLayer?.push({ ecommerce: null })
    window.dataLayer?.push({ event: name, ecommerce: payload })
    return
  }

  window.gtag?.("event", name, payload)
}

/**
 * Point d'entrée unique. Sans effet — et sans coût — tant qu'aucune balise n'est
 * configurée ou que la mesure d'audience n'est pas consentie.
 */
export function trackEcommerce(
  name: EcommerceEventName,
  payload: EcommercePayload
): void {
  if (typeof window === "undefined" || !TAGGING_ENABLED) {
    return
  }

  if (!analyticsAllowed()) {
    return
  }

  if (taggingReady()) {
    // Rattrapage : si un retard a laissé des événements en file, ils partent
    // AVANT celui-ci. Deux raisons — l'ordre chronologique est préservé, et un
    // vidage manqué se répare tout seul au prochain geste de l'utilisateur,
    // sans dépendre du seul appel de `GoogleTags`.
    flushAnalyticsQueue()
    dispatch(name, payload)
    return
  }

  if (queue.length >= MAX_QUEUED_EVENTS) {
    queue.shift()
  }

  queue.push({ name, payload })
}

/**
 * Vide la file — appelé par `GoogleTags` une fois la balise exécutée.
 *
 * La file n'est VIDÉE QUE si elle peut réellement partir. Appeler cette
 * fonction trop tôt est sans conséquence : les événements restent en attente
 * d'un appel ultérieur. C'est ce qui rend l'opération sûre alors que le moment
 * exact où `window.gtag` apparaît dépend de `next/script`.
 *
 * Le consentement, lui, est RECONTRÔLÉ : entre la mise en file et le vidage,
 * l'utilisateur a pu changer d'avis. Dans ce cas seulement la file est jetée —
 * un événement refusé est abandonné, jamais gardé pour plus tard.
 */
export function flushAnalyticsQueue(): void {
  if (queue.length === 0) {
    return
  }

  if (!analyticsAllowed()) {
    queue = []
    return
  }

  if (!taggingReady()) {
    return
  }

  const pending = queue
  queue = []

  for (const event of pending) {
    dispatch(event.name, event.payload)
  }
}

/* ──────────────────────── Achat : envoi unique ───────────────────────────── */

/**
 * Commandes déjà comptabilisées.
 *
 * `localStorage` et non `sessionStorage` : le lien de confirmation est rouvert
 * depuis l'historique ou l'e-mail de commande, souvent dans un autre onglet —
 * où une mémoire de session serait vide, et l'achat recompté.
 *
 * L'écriture est conditionnée au consentement « mesure d'audience », comme le
 * reste : c'est un stockage à finalité statistique, il en suit le sort et se
 * voit purgé par `clearAnalyticsStorage` en cas de retrait.
 */
const TRACKED_ORDERS_KEY = "hinaso_ga_orders"

/**
 * Quelques commandes suffisent : au-delà, un nouvel achat ne peut plus être le
 * doublon d'une visite aussi ancienne. Borne la taille du stockage.
 */
const TRACKED_ORDERS_KEPT = 20

function readTrackedOrders(): string[] {
  try {
    const raw = window.localStorage.getItem(TRACKED_ORDERS_KEY)
    const parsed: unknown = raw ? JSON.parse(raw) : []

    return Array.isArray(parsed)
      ? parsed.filter((value): value is string => typeof value === "string")
      : []
  } catch {
    // Navigation privée, quota saturé, stockage désactivé : on repart d'une
    // liste vide. Le pire cas est un achat compté deux fois, jamais une erreur
    // remontée à l'utilisateur au moment le plus sensible du parcours.
    return []
  }
}

/**
 * Émet `purchase` une seule fois par commande. Retourne `true` si l'événement
 * est parti, `false` s'il avait déjà été compté (ou n'était pas autorisé).
 */
export function trackPurchaseOnce(order: HttpTypes.StoreOrder): boolean {
  if (
    typeof window === "undefined" ||
    !TAGGING_ENABLED ||
    !analyticsAllowed()
  ) {
    return false
  }

  const tracked = readTrackedOrders()

  if (tracked.includes(order.id)) {
    return false
  }

  // Marqué AVANT l'envoi : deux montages rapprochés (Strict Mode en
  // développement, double rendu React) doivent voir la trace du premier, même
  // si l'événement est encore en file d'attente.
  try {
    window.localStorage.setItem(
      TRACKED_ORDERS_KEY,
      JSON.stringify([...tracked, order.id].slice(-TRACKED_ORDERS_KEPT))
    )
  } catch {
    // Sans mémoire, on émet quand même : mieux vaut un doublon possible qu'une
    // commande absente du chiffre d'affaires.
  }

  trackEcommerce("purchase", payloadFromOrder(order))

  return true
}

/* ─────────────────────── Mouvements sur une ligne de panier ──────────────── */

/**
 * Ajout ou retrait portant sur une ligne DÉJÀ dans le panier.
 *
 * `quantity` est le nombre d'unités CONCERNÉES par le mouvement, pas la
 * quantité restante sur la ligne — d'où sa présence en paramètre plutôt qu'une
 * lecture de `line.quantity`.
 */
export function payloadFromLine(
  line: TrackableLine,
  quantity: number,
  currencyCode?: string
): EcommercePayload {
  return {
    currency: currency(currencyCode),
    value: line.unit_price * quantity,
    items: [{ ...itemFromLine(line), quantity }],
  }
}

/**
 * Changement de quantité depuis le panier. GA4 n'a pas d'événement dédié : la
 * convention Google est d'émettre l'ÉCART, sous forme d'ajout ou de retrait.
 *
 * On envoie donc la DIFFÉRENCE et non la nouvelle quantité : passer de 2 à 3
 * est un ajout d'UNE unité. Envoyer 3 recompterait à chaque clic les unités
 * déjà comptabilisées, et le nombre d'articles ajoutés partirait en flèche sans
 * qu'aucune vente ne suive.
 *
 * Appelé APRÈS la mise à jour côté serveur, comme les autres mouvements : une
 * quantité refusée (stock insuffisant) ne doit rien produire.
 */
export function trackQuantityChange(
  line: TrackableLine,
  nextQuantity: number,
  currencyCode?: string
): void {
  const delta = nextQuantity - line.quantity

  if (delta === 0) {
    return
  }

  trackEcommerce(
    delta > 0 ? "add_to_cart" : "remove_from_cart",
    payloadFromLine(line, Math.abs(delta), currencyCode)
  )
}

/** Purge du stockage statistique, au retrait du consentement. */
export function clearAnalyticsStorage(): void {
  queue = []

  try {
    window.localStorage.removeItem(TRACKED_ORDERS_KEY)
  } catch {
    // Rien à faire : le stockage était déjà inaccessible.
  }
}
