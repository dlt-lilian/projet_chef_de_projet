"use client"

import React, { useEffect, useActionState } from "react";

import Input from "@modules/common/components/input"

import AccountInfo from "../account-info"
import { HttpTypes } from "@medusajs/types"
import { updateCustomerEmail } from "@lib/data/customer"

type MyInformationProps = {
  customer: HttpTypes.StoreCustomer
}

const ProfileEmail: React.FC<MyInformationProps> = ({ customer }) => {
  const [successState, setSuccessState] = React.useState(false)

  // L'ancienne version renvoyait « succès » sans rien envoyer : le TODO du
  // starter Medusa, dont l'API standard ne sait pas changer l'adresse de
  // connexion. Voir `updateCustomerEmail` et la route backend dédiée.
  const [state, formAction] = useActionState(updateCustomerEmail, {
    error: null as string | null,
    success: false,
  })

  const clearState = () => {
    setSuccessState(false)
  }

  useEffect(() => {
    setSuccessState(state.success)
  }, [state])

  return (
    <form action={formAction} className="w-full">
      <AccountInfo
        label="E-mail"
        currentInfo={`${customer.email}`}
        isSuccess={successState}
        isError={!!state.error}
        errorMessage={state.error || undefined}
        clearState={clearState}
        data-testid="account-email-editor"
      >
        <div className="grid grid-cols-1 gap-y-2">
          <Input
            label="E-mail"
            name="email"
            type="email"
            autoComplete="email"
            required
            defaultValue={customer.email}
            data-testid="email-input"
          />
          <Input
            label="Mot de passe actuel"
            name="password"
            type="password"
            autoComplete="current-password"
            required
            data-testid="email-password-input"
          />
          <p className="text-small-regular text-ui-fg-subtle">
            Par sécurité, confirmez avec votre mot de passe. Vous vous
            connecterez ensuite avec la nouvelle adresse.
          </p>
        </div>
      </AccountInfo>
    </form>
  )
}

export default ProfileEmail
