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
}

export default ConfiguratorModuleService
