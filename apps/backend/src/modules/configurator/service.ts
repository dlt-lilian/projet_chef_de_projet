import { MedusaService } from "@medusajs/framework/utils"
import {
  ConfiguratorProduct,
  ConfiguratorOption,
  ConfiguratorChoice,
} from "./models/configurator"

class ConfiguratorModuleService extends MedusaService({
  ConfiguratorProduct,
  ConfiguratorOption,
  ConfiguratorChoice,
}) {
  /**
   * Récupère un produit configurable complet (options + choix) par son handle.
   * Utilisé par la route store pour alimenter le storefront.
   */
  async getConfigByHandle(handle: string) {
    const [product] = await this.listConfiguratorProducts(
      { handle },
      { relations: ["options", "options.choices"] }
    )
    return product ?? null
  }

  /**
   * Tous les produits configurables avec leurs options et choix — pour l'admin.
   */
  async listConfigForAdmin() {
    return this.listConfiguratorProducts(
      {},
      { relations: ["options", "options.choices"] }
    )
  }

  /**
   * Garantit qu'un seul choix est « par défaut » au sein d'une option :
   * met `choiceId` à true et tous ses frères à false.
   */
  async setDefaultChoice(optionId: string, choiceId: string) {
    const siblings = await this.listConfiguratorChoices({ option_id: optionId })
    await Promise.all(
      siblings.map((c: { id: string }) =>
        this.updateConfiguratorChoices({
          id: c.id,
          is_default: c.id === choiceId,
        })
      )
    )
  }

  /**
   * Supprime une option et ses choix. Nécessaire car la contrainte FK entre
   * configurator_choice et configurator_option n'a pas de ON DELETE CASCADE
   * (seulement ON UPDATE CASCADE, cf. la migration Lot 1).
   */
  async deleteOptionCascade(optionId: string) {
    const choices = await this.listConfiguratorChoices({ option_id: optionId })
    if (choices.length) {
      await this.deleteConfiguratorChoices(choices.map((c: { id: string }) => c.id))
    }
    await this.deleteConfiguratorOptions(optionId)
  }
}

export default ConfiguratorModuleService
