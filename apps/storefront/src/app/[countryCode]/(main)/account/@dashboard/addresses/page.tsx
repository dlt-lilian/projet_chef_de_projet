import { Metadata } from "next"
import { notFound } from "next/navigation"

import AddressBook from "@modules/account/components/address-book"

import { getRegion } from "@lib/data/regions"
import { retrieveCustomer } from "@lib/data/customer"

export const metadata: Metadata = {
  title: "Adresses",
  description: "Consultez vos adresses",
}

export default async function Addresses(props: {
  params: Promise<{ countryCode: string }>
}) {
  const params = await props.params
  const { countryCode } = params
  const customer = await retrieveCustomer()
  const region = await getRegion(countryCode)

  if (!customer || !region) {
    notFound()
  }

  return (
    <div className="w-full" data-testid="addresses-page-wrapper">
      <div className="mb-8 flex flex-col gap-y-4">
        <h1 className="text-2xl-semi">Adresses de livraison</h1>
        <p className="text-base-regular">
          Consultez et modifiez vos adresses de livraison ; vous pouvez en
          ajouter autant que vous le souhaitez. Enregistrer vos adresses les
          rendra disponibles lors de la commande.
        </p>
      </div>
      <AddressBook customer={customer} region={region} />
    </div>
  )
}
