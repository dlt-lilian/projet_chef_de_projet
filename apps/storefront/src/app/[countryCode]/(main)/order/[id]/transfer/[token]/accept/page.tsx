import { acceptTransferRequest } from "@lib/data/orders"
import { Heading, Text } from "@modules/common/components/ui"
import TransferImage from "@modules/order/components/transfer-image"

export default async function TransferPage({
  params,
}: {
  params: { id: string; token: string }
}) {
  const { id, token } = params

  const { success, error } = await acceptTransferRequest(id, token)

  return (
    <div className="flex flex-col gap-y-4 items-start w-2/5 mx-auto mt-10 mb-20">
      <TransferImage />
      <div className="flex flex-col gap-y-6">
        {success && (
          <>
            <Heading level="h1" className="text-xl text-zinc-900">
              Commande transférée !
            </Heading>
            <Text className="text-zinc-600">
              La commande {id} a bien été transférée au nouveau propriétaire.
            </Text>
          </>
        )}
        {!success && (
          <>
            <Text className="text-zinc-600">
              Une erreur est survenue lors de l&apos;acceptation du transfert. Veuillez réessayer.
            </Text>
            {error && (
              <Text className="text-red-500">Message d&apos;erreur : {error}</Text>
            )}
          </>
        )}
      </div>
    </div>
  )
}
