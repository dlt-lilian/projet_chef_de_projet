import repeat from "@lib/util/repeat"
import { HttpTypes } from "@medusajs/types"
import { Heading, Table } from "@modules/common/components/ui"

import Item from "@modules/cart/components/item"
import ItemCard from "@modules/cart/components/item-card"
import SkeletonLineItem from "@modules/skeletons/components/skeleton-line-item"

type ItemsTemplateProps = {
  cart?: HttpTypes.StoreCart
}

/** Plus récent d'abord, sans muter les lignes du panier. */
const sortByNewest = (items: HttpTypes.StoreCartLineItem[]) =>
  [...items].sort((a, b) => ((a.created_at ?? "") > (b.created_at ?? "") ? -1 : 1))

const ItemsTemplate = ({ cart }: ItemsTemplateProps) => {
  const items = cart?.items

  return (
    <div>
      <div className="pb-3 flex items-center">
        <Heading className="text-[2rem] leading-[2.75rem]">Panier</Heading>
      </div>

      {/* Mobile : le tableau ci-dessous (5 colonnes) ne tient pas sous 1024 px,
          on affiche des cartes empilées à la place. */}
      <ul className="flex flex-col gap-4 small:hidden" data-testid="items-list">
        {items
          ? sortByNewest(items).map((item) => (
              <ItemCard
                key={item.id}
                item={item}
                currencyCode={cart?.currency_code}
              />
            ))
          : repeat(5).map((i) => (
              <li key={i} className="flex gap-4 animate-pulse">
                <div className="shrink-0 w-24 h-24 rounded-large bg-grey-10" />
                <div className="flex flex-col gap-2 flex-1 py-1">
                  <div className="h-4 w-1/2 rounded-base bg-grey-10" />
                  <div className="h-3 w-1/3 rounded-base bg-grey-10" />
                  <div className="h-9 w-36 rounded-circle bg-grey-10 mt-2" />
                </div>
              </li>
            ))}
      </ul>

      <Table className="hidden small:table">
        <Table.Header className="border-t-0">
          <Table.Row className="text-ui-fg-subtle txt-medium-plus">
            <Table.HeaderCell className="!pl-0">Objets</Table.HeaderCell>
            <Table.HeaderCell></Table.HeaderCell>
            <Table.HeaderCell>Quantité</Table.HeaderCell>
            <Table.HeaderCell className="hidden small:table-cell">
              Prix
            </Table.HeaderCell>
            <Table.HeaderCell className="!pr-0 text-right">
              Total
            </Table.HeaderCell>
          </Table.Row>
        </Table.Header>
        <Table.Body>
          {items
            ? sortByNewest(items).map((item) => (
                <Item
                  key={item.id}
                  item={item}
                  currencyCode={cart?.currency_code}
                />
              ))
            : repeat(5).map((i) => {
                return <SkeletonLineItem key={i} />
              })}
        </Table.Body>
      </Table>
    </div>
  )
}

export default ItemsTemplate
