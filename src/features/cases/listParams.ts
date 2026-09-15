// The shelf view's state lives in the URL, not in a useState — the same rule
// as the item list, and for the same reason: a filtered view should be
// something you can send to someone and reach again with the back button.

import type { ItemQuery } from '../../api/items'

export const PAGE_SIZE = 24

export const SORT_OPTIONS = [
  { label: 'Nazwa', value: 'name' },
  { label: 'Ostatnio zmienione', value: 'updatedAt' },
  { label: 'Ostatnio dodane', value: 'createdAt' },
] as const

export type CaseSort = (typeof SORT_OPTIONS)[number]['value']

// Name, not a timestamp: a shelf is something people read alphabetically and
// point at, unlike the catalog, where what changed last is the useful order.
const DEFAULT_SORT: CaseSort = 'name'

// A box is a card of kind `case`, so the shelf is the item list asked one
// question. Everything else on this screen — the search box, the sort, the
// paging — is the item list's, which is why there is no case query type left.
export function readCaseParams(search: URLSearchParams): ItemQuery {
  const page = Number(search.get('page'))

  return {
    // The grid shows the outside measurements and what goes in, and both are
    // rows on the sheet.
    attributes: true,
    category: null,
    condition: null,
    direction: 'asc',
    kind: 'case',
    limit: PAGE_SIZE,
    model: search.get('model')?.trim() || null,
    offset: Number.isInteger(page) && page > 1 ? (page - 1) * PAGE_SIZE : 0,
    search: search.get('q')?.trim() || null,
    sort: readSort(search.get('sort')),
  }
}

// Only what differs from the default is written back, so a plain shelf stays
// at a clean /cases instead of carrying parameters that say "as usual".
export function writeCaseParams(query: ItemQuery): URLSearchParams {
  const params = new URLSearchParams()

  if (query.search) params.set('q', query.search)
  if (query.model) params.set('model', query.model)
  if (query.sort !== DEFAULT_SORT) params.set('sort', query.sort)

  const page = pageFromOffset(query.offset)
  if (page > 1) params.set('page', String(page))

  return params
}

export function pageFromOffset(offset: number): number {
  return Math.floor(Math.max(offset, 0) / PAGE_SIZE) + 1
}

// Changing a filter has to send you back to the first page. Staying on page 4
// of a result set that now has one page shows an empty screen that looks like
// "nothing matches" when the truth is "you are past the end".
export function withFilter(query: ItemQuery, changes: Partial<ItemQuery>): ItemQuery {
  return { ...query, ...changes, offset: 0 }
}

function readSort(value: null | string): CaseSort {
  const match = SORT_OPTIONS.find((option) => option.value === value?.trim())
  return match?.value ?? DEFAULT_SORT
}
