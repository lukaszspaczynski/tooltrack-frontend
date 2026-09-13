// The manual library's state, in the URL for the same reason every other list
// here keeps it there: a filtered view should survive a refresh and be
// sendable as a link.

export const MANUAL_PAGE_SIZE = 24

export type ManualQuery = {
  limit: number
  offset: number
  search: null | string
}

export function readManualListParams(search: URLSearchParams): ManualQuery {
  const page = Number(search.get('page'))

  return {
    limit: MANUAL_PAGE_SIZE,
    offset: Number.isInteger(page) && page > 1 ? (page - 1) * MANUAL_PAGE_SIZE : 0,
    search: search.get('q')?.trim() || null,
  }
}

export function writeManualListParams(query: ManualQuery): URLSearchParams {
  const params = new URLSearchParams()

  if (query.search) params.set('q', query.search)

  const page = manualListPage(query)
  if (page > 1) params.set('page', String(page))

  return params
}

export function manualListPage(query: ManualQuery): number {
  return Math.floor(Math.max(query.offset, 0) / MANUAL_PAGE_SIZE) + 1
}

// Any filter change goes back to the first page: staying on page 4 of a result
// set that now has one shows an empty screen reading "nothing here" when the
// truth is "you are past the end".
export function withManualFilter(query: ManualQuery, changes: Partial<ManualQuery>): ManualQuery {
  return { ...query, ...changes, offset: 0 }
}
