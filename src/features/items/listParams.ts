// The list view's state lives in the URL, not in a useState.
//
// That is what makes a filtered view something you can send to someone, keep
// as a bookmark, and reach again with the browser's back button after opening
// an item. These functions are the only translation between the address bar and
// the query the API is asked, and they are pure so both directions can be
// tested.

import type { ItemQuery } from '../../api/items'
import { ITEM_CONDITIONS, type ItemKind } from '../../api/types'

export const PAGE_SIZE = 24

export const SORT_OPTIONS = [
  { label: 'Ostatnio zmienione', value: 'updatedAt' },
  { label: 'Ostatnio dodane', value: 'createdAt' },
  { label: 'Nazwa', value: 'name' },
] as const

export type ItemSort = (typeof SORT_OPTIONS)[number]['value']

const DEFAULT_SORT: ItemSort = 'updatedAt'

export function readItemParams(search: URLSearchParams): ItemQuery {
  const page = Number(search.get('page'))

  return {
    category: search.get('category')?.trim() || null,
    condition: readCondition(search.get('condition')),
    kind: readKind(search.get('kind')),
    // Name reads naturally A→Z; the two timestamps read newest first.
    direction: readSort(search.get('sort')) === 'name' ? 'asc' : 'desc',
    limit: PAGE_SIZE,
    offset: Number.isInteger(page) && page > 1 ? (page - 1) * PAGE_SIZE : 0,
    search: search.get('q')?.trim() || null,
    sort: readSort(search.get('sort')),
  }
}

// Only what differs from the default is written back, so a plain list stays at
// a clean `/` instead of carrying five parameters that say "as usual".
export function writeItemParams(query: ItemQuery): URLSearchParams {
  const params = new URLSearchParams()

  if (query.search) params.set('q', query.search)
  if (query.category) params.set('category', query.category)
  if (query.condition) params.set('condition', query.condition)
  if (query.kind) params.set('kind', query.kind)
  if (query.sort !== DEFAULT_SORT) params.set('sort', query.sort)

  const page = pageFromOffset(query.offset)
  if (page > 1) params.set('page', String(page))

  return params
}

export function pageFromOffset(offset: number): number {
  return Math.floor(Math.max(offset, 0) / PAGE_SIZE) + 1
}

export function offsetFromPage(page: number): number {
  return Math.max(page - 1, 0) * PAGE_SIZE
}

// Changing a filter has to send you back to the first page. Staying on page 4
// of a result set that now has one page shows an empty screen that looks like
// "nothing matches" when the truth is "you are past the end".
export function withFilter(query: ItemQuery, changes: Partial<ItemQuery>): ItemQuery {
  return { ...query, ...changes, offset: 0 }
}

function readSort(value: null | string): ItemSort {
  const match = SORT_OPTIONS.find((option) => option.value === value?.trim())
  return match?.value ?? DEFAULT_SORT
}

function readCondition(value: null | string): null | string {
  const trimmed = value?.trim()
  if (!trimmed) return null
  // An unknown condition in a pasted link is dropped rather than sent on: the
  // API answers 400 for one, and an empty error screen is a worse answer to a
  // stale bookmark than simply showing everything.
  return (ITEM_CONDITIONS as readonly string[]).includes(trimmed) ? trimmed : null
}

// An unknown kind in a pasted link is dropped rather than sent on, exactly as
// an unknown condition is: a link somebody shared should still show the
// catalog rather than an error about a parameter nobody typed on purpose.
function readKind(raw: null | string): ItemKind | null {
  const value = raw?.trim()
  return value === 'tool' || value === 'appliance' || value === 'case' ? value : null
}
