import type {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import { Modules } from "@medusajs/framework/utils"
import { z } from "@medusajs/framework/zod"
import { updateCustomersWorkflow } from "@medusajs/medusa/core-flows"

/**
 * POST /store/customers/me/email
 *
 * Change l'adresse e-mail du client connecté. Body : { email, password }.
 *
 * POURQUOI UNE ROUTE DÉDIÉE. `POST /store/customers/me` ignore `email` (le
 * validateur de Medusa ne l'accepte pas), et pour cause : l'adresse est AUSSI
 * l'identifiant de connexion, stocké à part dans le module d'authentification
 * (`provider_identity.entity_id` du fournisseur emailpass). Ne changer que la
 * fiche client laisserait le client se connecter avec l'ancienne adresse.
 *
 * Le mot de passe actuel est exigé : une session dérobée ne doit pas suffire
 * à s'approprier le compte en détournant son adresse. Aucun e-mail de
 * confirmation n'est envoyé, faute de fournisseur de notifications.
 *
 * Authentification : couverte par le middleware Medusa de
 * `/store/customers/me*`, revérifiée ci-dessous par précaution.
 */

const EMAILPASS = "emailpass"

export const POST = async (
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse
) => {
  const customerId = req.auth_context?.actor_id
  const authIdentityId = req.auth_context?.auth_identity_id
  if (!customerId || !authIdentityId) {
    return res.status(401).json({ message: "Connexion requise." })
  }

  const body = (req.body ?? {}) as Record<string, unknown>
  // `trim` seulement, pas de mise en minuscules : la connexion emailpass
  // compare l'adresse À L'IDENTIQUE, comme l'inscription l'a enregistrée.
  const email = typeof body.email === "string" ? body.email.trim() : ""
  const password = typeof body.password === "string" ? body.password : ""

  if (!z.string().email().safeParse(email).success) {
    return res.status(400).json({ message: "Adresse e-mail invalide." })
  }
  if (!password) {
    return res.status(400).json({ message: "Mot de passe actuel requis." })
  }

  const auth = req.scope.resolve(Modules.AUTH)
  const customers = req.scope.resolve(Modules.CUSTOMER)

  const identity = await auth.retrieveAuthIdentity(authIdentityId, {
    relations: ["provider_identities"],
  })
  const login = identity.provider_identities?.find(
    (p) => p.provider === EMAILPASS
  )
  if (!login) {
    return res.status(400).json({
      message: "Ce compte ne se connecte pas par e-mail et mot de passe.",
    })
  }

  // Vérifie le mot de passe contre l'identifiant ACTUEL, et contre CETTE
  // identité : un mot de passe valide pour un autre compte ne compte pas.
  const check = await auth.authenticate(EMAILPASS, {
    body: { email: login.entity_id, password },
  })
  if (!check.success || check.authIdentity?.id !== authIdentityId) {
    return res.status(401).json({ message: "Mot de passe incorrect." })
  }

  const customer = await customers.retrieveCustomer(customerId)
  if (email === login.entity_id && email === customer.email) {
    return res.json({ customer })
  }

  // Adresse déjà prise, par un autre identifiant de connexion ou par un autre
  // compte client : contrôlé AVANT toute écriture.
  const [takenLogin] = await auth.listProviderIdentities({
    entity_id: email,
    provider: EMAILPASS,
  })
  const [takenAccount] = await customers.listCustomers({
    email,
    has_account: true,
  })
  if (
    (takenLogin && takenLogin.id !== login.id) ||
    (takenAccount && takenAccount.id !== customerId)
  ) {
    return res.status(409).json({
      message: "Cette adresse e-mail est déjà utilisée par un autre compte.",
    })
  }

  // Identifiant de connexion d'abord, fiche client ensuite. Si la seconde
  // écriture échoue, la première est rétablie : les deux ne doivent jamais
  // diverger, sinon le client ne sait plus avec quelle adresse se connecter.
  await auth.updateProviderIdentities([{ id: login.id, entity_id: email }])
  try {
    await updateCustomersWorkflow(req.scope).run({
      input: { selector: { id: customerId }, update: { email } },
    })
  } catch (error) {
    await auth.updateProviderIdentities([
      { id: login.id, entity_id: login.entity_id },
    ])
    throw error
  }

  res.json({ customer: await customers.retrieveCustomer(customerId) })
}
