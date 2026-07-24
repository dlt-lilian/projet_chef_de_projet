import { Heading, Text } from "@modules/common/components/ui"
import TransferActions from "@modules/order/components/transfer-actions"
import TransferImage from "@modules/order/components/transfer-image"

export default async function TransferPage({
  params,
}: {
  params: { id: string; token: string }
}) {
  const { id, token } = params

  return (
    <div className="flex flex-col gap-y-4 items-start w-2/5 mx-auto mt-10 mb-20">
      <TransferImage />
      <div className="flex flex-col gap-y-6">
        <Heading level="h1" className="text-xl text-zinc-900">
          Demande de transfert pour la commande {id}
        </Heading>
        <Text className="text-zinc-600">
          Vous avez reçu une demande de transfert de propriété de votre commande ({id}).
          Si vous acceptez cette demande, vous pouvez approuver le transfert en
          cliquant sur le bouton ci-dessous.
        </Text>
        <div className="w-full h-px bg-zinc-200" />
        <Text className="text-zinc-600">
          Si vous acceptez, le nouveau propriétaire prendra en charge toutes les
          responsabilités et autorisations associées à cette commande.
        </Text>
        <Text className="text-zinc-600">
          Si vous ne reconnaissez pas cette demande ou souhaitez conserver la
          propriété, aucune action supplémentaire n&apos;est nécessaire.
        </Text>
        <div className="w-full h-px bg-zinc-200" />
        <TransferActions id={id} token={token} />
      </div>
    </div>
  )
}
