import type { QueryClient } from '@tanstack/react-query'

import {
  addAttribute,
  deleteAttribute,
  fetchAttributeNames,
  updateAttribute,
} from '../../api/items'
import type { ItemDetail } from '../../api/types'
import type { AttributeApi } from './components/AttributePanel'

// What the shared panel needs to edit an item's spec sheet.
export const ITEM_ATTRIBUTE_API: AttributeApi<{ item: ItemDetail }> = {
  add: addAttribute,
  cache: async (queryClient: QueryClient, itemId, { item }) => {
    queryClient.setQueryData(['item', itemId], { item })
    await queryClient.invalidateQueries({ queryKey: ['item-attribute-names'] })
  },
  names: fetchAttributeNames,
  namesKey: 'item-attribute-names',
  remove: deleteAttribute,
  update: updateAttribute,
}
