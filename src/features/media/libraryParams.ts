// The library screen's state, in the URL for the same reason the catalog's is:
// a filtered view should survive a refresh and be sendable as a link.

import type { LibraryQuery } from '../../api/photos'

export const LIBRARY_PAGE_SIZE = 48

export const SOURCE_OPTIONS = [
  { label: 'Wgrane', value: 'upload' },
  { label: 'Z adresu', value: 'url' },
  { label: 'Z wyszukiwarki', value: 'search' },
] as const

export function readLibraryParams(search: URLSearchParams): LibraryQuery {
  const page = Number(search.get('page'))

  return {
    limit: LIBRARY_PAGE_SIZE,
    offset: Number.isInteger(page) && page > 1 ? (page - 1) * LIBRARY_PAGE_SIZE : 0,
    search: search.get('q')?.trim() || null,
    source: readSource(search.get('source')),
  }
}

export function writeLibraryParams(query: LibraryQuery): URLSearchParams {
  const params = new URLSearchParams()

  if (query.search) params.set('q', query.search)
  if (query.source) params.set('source', query.source)

  const page = Math.floor(Math.max(query.offset, 0) / LIBRARY_PAGE_SIZE) + 1
  if (page > 1) params.set('page', String(page))

  return params
}

export function libraryPage(query: LibraryQuery): number {
  return Math.floor(Math.max(query.offset, 0) / LIBRARY_PAGE_SIZE) + 1
}

export function withLibraryFilter(
  query: LibraryQuery,
  changes: Partial<LibraryQuery>,
): LibraryQuery {
  // Any filter change goes back to the first page: staying on page 4 of a
  // result set that now has one shows an empty screen that reads as "nothing
  // here" when the truth is "you are past the end".
  return { ...query, ...changes, offset: 0 }
}

function readSource(value: null | string): null | string {
  const trimmed = value?.trim()
  if (!trimmed) return null
  // An unknown source in a stale link is dropped rather than sent on: the API
  // answers 400 for one, and an error screen is a poor answer to an old
  // bookmark.
  return SOURCE_OPTIONS.some((option) => option.value === trimmed) ? trimmed : null
}
