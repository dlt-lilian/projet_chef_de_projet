"use client"

import { HttpTypes } from "@medusajs/types"
import Image from "next/image"
import { lazy, Suspense, useCallback, useMemo, useRef } from "react"
import {
  ConfiguratorOption,
  ConfiguratorProductConfig,
  darkenToTint,
} from "../config/configurableProducts"
import { useProductConfigurator } from "../hooks/useProductConfigurator"
import type { InitialConfiguration } from "../lib/persistence"
import ConfiguratorSidebar from "./ConfiguratorSidebar"
import type { ConfiguratorViewerHandle } from "./ConfiguratorViewer"

// three.js (~1 Mo) est isolé dans un chunk chargé à la demande : absent du bundle
// des fiches produit standard, et différé (avec un squelette) sur les fiches
// configurables. `React.lazy` transmet le `ref` aux composants `forwardRef` (ce
// qu'est ConfiguratorViewer) → le pilotage impératif du modèle reste intact.
// `import type` ci-dessus : le type est effacé au build, il ne réintègre donc
// PAS le viewer dans le bundle statique.
const ConfiguratorViewer = lazy(() => import("./ConfiguratorViewer"))

type ConfiguratorLayoutProps = {
  product: HttpTypes.StoreProduct
  config: ConfiguratorProductConfig
  /** Config à restaurer (rouverture d'un article du panier via `?line=`). */
  initialConfiguration?: InitialConfiguration
}

export default function ConfiguratorLayout({
  product,
  config,
  initialConfiguration,
}: ConfiguratorLayoutProps) {
  const viewerRef = useRef<ConfiguratorViewerHandle>(null)
  const controller = useProductConfigurator(config, initialConfiguration)

  // Applique une sélection : couleur unie → applyColor, texture/motif → swapTexture.
  const applyOption = useCallback(
    (option: ConfiguratorOption, choiceId: string) => {
      if (option.type === "engraving") return
      const choice = option.choices.find((c) => c.id === choiceId)
      if (!choice) return
      if (option.type === "color") {
        if (choice.colorHex) {
          void viewerRef.current?.applyColor(option.targetMesh, choice.colorHex)
        }
        return
      }
      if (option.type === "motif") {
        // `choice.texturePath` peut être absent (choix « Aucun ») → retire l'overlay.
        void viewerRef.current?.applyMotif(option.targetMesh, choice.texturePath)
        return
      }
      if (choice.texturePath) {
        // `darken` (options bois) → teinte multiplicatrice qui assombrit bois_1.jpg.
        const tint =
          choice.darken != null ? darkenToTint(choice.darken) : undefined
        void viewerRef.current?.swapTexture(
          option.targetMesh,
          choice.texturePath,
          tint
        )
      }
    },
    []
  )

  // Applique toutes les sélections courantes au modèle. Appelé À CHAQUE fois que
  // le GLB est prêt — y compris après un rechargement du modèle — pour que le
  // rendu 3D reflète toujours l'état (défaut OU config restaurée depuis une
  // ligne de panier), sans jamais retomber au générique.
  // Textures/motifs d'abord, puis couleurs : sur un mesh partagé la couleur unie
  // l'emporte par défaut (cohérent avec l'ancien système où "uni" = couleur).
  const handleModelReady = useCallback(() => {
    const apply = (option: ConfiguratorOption) => {
      const choiceId = controller.getSelectedChoiceId(option.id)
      if (choiceId) applyOption(option, choiceId)
    }
    config.options.filter((o) => o.type !== "color").forEach(apply)
    config.options.filter((o) => o.type === "color").forEach(apply)
  }, [config, controller, applyOption])

  // `config` est un nouvel objet à chaque rendu serveur (fetch admin / repli) :
  // on fige la rotation par ses VALEURS pour éviter que le viewer ne recharge le
  // GLB à chaque re-render (ex. après `revalidateTag` d'un ajout au panier).
  const modelRotationDeg = useMemo(
    () => config.modelRotationDeg,
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [
      config.modelRotationDeg?.[0],
      config.modelRotationDeg?.[1],
      config.modelRotationDeg?.[2],
    ]
  )

  // Zoom contextuel : à l'ouverture d'un menu d'option, cadre la caméra sur le
  // mesh ciblé (Bois, Vis, Papier…) ; à la fermeture (ou option sans mesh, ex.
  // gravure), revient à la vue initiale du modèle.
  const handleActiveOption = useCallback(
    (optionId: string | null) => {
      const viewer = viewerRef.current
      if (!viewer) return
      const option = optionId
        ? config.options.find((o) => o.id === optionId)
        : undefined
      const target = option?.targetMesh
      if (target) viewer.focusMeshes(target)
      else viewer.resetView()
    },
    [config]
  )

  // Poster de premier rendu. Le visuel produit remplace l'aplat gris qui
  // s'affichait jusqu'ici derrière « Chargement du configurateur… » : trois
  // fiches sur trois ouvraient donc sur un rectangle vide le temps de charger
  // ~1 Mo de three.js puis le GLB.
  //
  // Ce repli est rendu CÔTÉ SERVEUR (React sérialise le fallback d'un Suspense
  // dans le HTML initial), il constitue donc un vrai élément LCP mesurable —
  // ce que ne pouvait pas être un aplat de couleur.
  const posterSrc = product.thumbnail ?? undefined
  const posterAlt = `${product.title} — aperçu avant chargement du configurateur 3D`

  return (
    <div className="flex flex-col w-full h-[calc(100dvh-61px)] md:h-auto md:min-h-[80vh]">
      {/* Titre produit — H1 UNIQUE de la page, hors des deux branches
          responsives.
          Il vivait auparavant dans la barre latérale desktop, marquée
          `hidden md:flex` : sous 768 px il était donc en `display:none`, et la
          feuille mobile n'affichait aucun nom de produit. Deux conséquences —
          l'indexation de Google est mobile-first, et un visiteur mobile
          arrivait sur une fiche sans jamais lire ce qu'il regardait.
          Le sortir ici plutôt que de le dupliquer dans chaque branche garde un
          H1 et un seul dans le DOM, visible à tous les breakpoints. */}
      <header className="flex-none px-4 pt-4 pb-3 md:px-6 md:pt-6 md:pb-4 border-b border-stone-200 bg-white">
        <h1 className="text-xl md:text-2xl font-semibold text-stone-900">
          {product.title}
        </h1>
        {product.subtitle && (
          <p className="mt-1 text-sm text-stone-600">{product.subtitle}</p>
        )}
      </header>

      {/* `flex-1 min-h-0` : la hauteur bornée est portée par le conteneur
          ci-dessus, la zone configurateur occupe simplement ce qui reste sous
          l'en-tête — la feuille mobile garde donc son `max-h-[60%]` sans jamais
          déborder sous la ligne de flottaison. */}
      <section
        className="flex flex-1 min-h-0 flex-col md:flex-row w-full"
        data-testid="configurator-layout"
      >
        <div className="flex-1 min-h-0 w-full md:w-[60%] bg-stone-50">
          <Suspense
            fallback={
              <div className="relative w-full h-full min-h-[240px] md:min-h-[480px] bg-stone-100 flex items-center justify-center">
                {posterSrc && (
                  <Image
                    src={posterSrc}
                    alt={posterAlt}
                    fill
                    // `priority` : c'est l'élément LCP de la fiche, on veut un
                    // <link rel="preload"> plutôt qu'un chargement différé.
                    priority
                    sizes="(max-width: 768px) 100vw, 60vw"
                    className="object-contain"
                  />
                )}
                <div className="relative px-3 py-1.5 rounded-full bg-white/80 text-sm text-stone-700 shadow-sm">
                  Chargement du configurateur…
                </div>
              </div>
            }
          >
            <ConfiguratorViewer
              ref={viewerRef}
              glbPath={config.glbPath}
              rotationSpeed={config.autoRotate === false ? 0 : 1}
              modelRotationDeg={modelRotationDeg}
              onModelReady={handleModelReady}
              posterSrc={posterSrc}
              posterAlt={posterAlt}
            />
          </Suspense>
        </div>
        <ConfiguratorSidebar
          product={product}
          config={config}
          controller={controller}
          onOptionChange={applyOption}
          onActiveOptionChange={handleActiveOption}
        />
      </section>
    </div>
  )
}
