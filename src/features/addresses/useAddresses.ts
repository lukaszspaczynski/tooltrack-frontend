import { useQuery } from '@tanstack/react-query'

import { fetchAddresses } from '../../api/addresses'
import type { Address } from '../../api/types'

// The short list of places, and a way to look one up by id.
//
// Every screen that shows a place needs the same two things a card does not
// carry: the name and the colour. A tool answers with `addressId` and nothing
// else, and widening the list so each row could show a place without a lookup
// would put a whole address — seven fields and two counts — on every row of
// every list, to draw a dot and five letters.
//
// So it is one query for the whole list, under the key the select and the
// detail field already use. A workshop has a handful of places; one request
// serves a grid of two hundred cards, and a second screen pays nothing.
export function useAddresses(): {
  addressById: (id: null | number) => Address | null
  addresses: Address[]
  pending: boolean
} {
  const query = useQuery({
    queryFn: () => fetchAddresses({ limit: 500, offset: 0, search: null, sort: 'name' }),
    queryKey: ['addresses', { limit: 500, search: null, sort: 'name' }],
    // Places change far less often than the lists that show them, and a stale
    // name for a minute is better than a request behind every grid.
    staleTime: 60_000,
  })

  const addresses = query.data?.items ?? []

  return {
    addressById: (id) => (id === null ? null : (addresses.find((item) => item.id === id) ?? null)),
    addresses,
    pending: query.isPending,
  }
}
