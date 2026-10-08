/**
 * Bandeau d'avertissement en tête de toutes les pages : Hinaso est une
 * boutique fictive (projet de portfolio). Non collant — la navbar est déjà
 * `sticky top-0` — il disparaît au premier défilement.
 *
 * Monté dans le layout racine pour couvrir aussi le tunnel de commande :
 * c'est précisément là qu'un visiteur pourrait croire à une vraie vente.
 */
export default function DemoBanner() {
  return (
    <div
      role="note"
      className="bg-primary text-white text-xs small:text-sm text-center px-4 py-2"
    >
      Site fictif réalisé par Lilian Dulot — aucune commande ne sera expédiée.{" "}
      <a
        href="https://liliandulot.fr"
        target="_blank"
        rel="noopener"
        className="underline underline-offset-2 font-medium hover:opacity-80 transition-opacity"
      >
        Voir mon portfolio
      </a>
    </div>
  )
}
