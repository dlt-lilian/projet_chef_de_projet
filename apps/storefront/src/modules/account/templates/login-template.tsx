"use client"

import { useState } from "react"

import Register from "@modules/account/components/register"
import Login from "@modules/account/components/login"

export enum LOGIN_VIEW {
  SIGN_IN = "sign-in",
  REGISTER = "register",
}

type LoginTemplateProps = {
  /** Destination après connexion (tunnel de commande, typiquement). */
  redirectTo?: string
  /** Raison de l'arrivée sur cette page, affichée au-dessus du formulaire. */
  notice?: string
}

const LoginTemplate = ({ redirectTo, notice }: LoginTemplateProps) => {
  const [currentView, setCurrentView] = useState("sign-in")

  return (
    <div className="w-full flex justify-start px-8 py-8">
      {currentView === "sign-in" ? (
        <Login
          setCurrentView={setCurrentView}
          redirectTo={redirectTo}
          notice={notice}
        />
      ) : (
        <Register setCurrentView={setCurrentView} />
      )}
    </div>
  )
}

export default LoginTemplate
