// The shelf view's state lives in the URL, not in a useState — the same rule
// as the item list, and for the same reason: a filtered view should be
// something you can send to someone and reach again with the back button.

import type { CaseQuery } from '../../api/cases'

export const PAGE_SIZE = 24

export const SORT_OPTIONS = [
  { label: 'Nazwa', value: 'name' },
  { label: 'Pojemność', value: 'capacityL' },
  { label: 'Ostatnio zmienione', value: 'updatedAt' },
  { label: 'Ostatnio dodane', value: 'createdAt' },
] as const

export type CaseSort = (typeof SORT_OPTIONS)[number]['value']

// Name, not a timestamp: a shelf is something people read alphabetically and
// point at, unlike the catalog, where what changed last is the useful order.
const DEFAULT_SORT: CaseSort = 'name'

export function readCaseParams(search: URLSearchParams): CaseQuery {
  const page = Number(search.get('page'))

  return {
    limit: PAGE_SIZE,
    manufacturer: search.get('manufacturer')?.trim() || null,
    offset: Number.isInteger(page) && page > 1 ? (page - 1) * PAGE_SIZE : 0,
    search: search.get('q')?.trim() || null,
    sort: readSort(search.get('sort')),
  }
}

// Only what differs from the default is written back, so a plain shelf stays
// at a clean /cases instead of carrying parameters that say "as usual".
export function writeCaseParams(query: CaseQuery): URLSearchParams {
  const params = new URLSearchParams()

  if (query.search) params.set('q', query.search)
  if (query.manufacturer) params.set('manufacturer', query.manufacturer)
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
export function withFilter(query: CaseQuery, changes: Partial<CaseQuery>): CaseQuery {
  return { ...query, ...changes, offset: 0 }
}

function readSort(value: null | string): CaseSort {
  const match = SORT_OPTIONS.find((option) => option.value === value?.trim())
  return match?.value ?? DEFAULT_SORT
}
