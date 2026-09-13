// The label screen's state, in the URL for the same reason the catalog's and
// the photo library's are: a filtered view should survive a refresh and be
// sendable as a link.

import type { LabelQuery } from '../../api/labels'

export const LABEL_PAGE_SIZE = 24

// What "wszystkie" asks for: the server's own ceiling on this list. A shelf of
// labels is hundreds at most, so one page of them is a page and not a denial
// of service — and the button that turns it on says how many it is about to
// show, which is this and not the total when a shelf runs past it.
export const LABEL_ALL_LIMIT = 200

// The server takes at most fifty ids per redraw. The screen may hold more than
// that in one selection, so it sends them in batches of this size rather than
// letting the last ones fail.
export const REFRESH_BATCH_SIZE = 50

export const TEMPLATE_OPTIONS = [
  { label: 'Numer porządkowy', value: 'number' },
  { label: 'Zawartość', value: 'contents' },
] as const

export function readLabelListParams(search: URLSearchParams): LabelQuery {
  const page = Number(search.get('page'))
  const organizerId = Number(search.get('organizerId'))
  // Everything on one page, and then the page is the selection: ticking labels
  // for a print sheet across four pages loses the ticks at every turn, because
  // a selection is about what is on the screen.
  const all = search.get('all') === '1'

  return {
    limit: all ? LABEL_ALL_LIMIT : LABEL_PAGE_SIZE,
    offset: all || !(Number.isInteger(page) && page > 1) ? 0 : (page - 1) * LABEL_PAGE_SIZE,
    organizerId: Number.isSafeInteger(organizerId) && organizerId > 0 ? organizerId : null,
    search: search.get('q')?.trim() || null,
    template: readTemplate(search.get('template')),
  }
}

export function writeLabelListParams(query: LabelQuery): URLSearchParams {
  const params = new URLSearchParams()

  if (query.search) params.set('q', query.search)
  if (query.template) params.set('template', query.template)
  if (query.organizerId !== null) params.set('organizerId', String(query.organizerId))

  if (showingAll(query)) {
    params.set('all', '1')
    return params
  }

  const page = labelListPage(query)
  if (page > 1) params.set('page', String(page))

  return params
}

export function showingAll(query: LabelQuery): boolean {
  return query.limit > LABEL_PAGE_SIZE
}

// Switching between the two views. Either way it starts from the top: page 4
// of a paged list is nowhere in particular once the list stops being paged.
export function withAllShown(query: LabelQuery, all: boolean): LabelQuery {
  return { ...query, limit: all ? LABEL_ALL_LIMIT : LABEL_PAGE_SIZE, offset: 0 }
}

// How many rows "wszystkie" will really put on the screen. The server refuses
// more than its own ceiling, so a button promising every one of three hundred
// labels and then showing two hundred would be the screen lying about what it
// is about to do.
export function allShownCount(total: number): number {
  return Math.min(total, LABEL_ALL_LIMIT)
}

// The rows one screenful cannot reach. Not nothing: they are still there, and
// the paged view is where they are read — which is why the way back to it stays
// on the screen while this is above zero.
export function labelsBeyondAll(total: number): number {
  return Math.max(total - LABEL_ALL_LIMIT, 0)
}

// A selection is about what is on the screen. Turning the page, changing a
// filter or coming back through history changes the rows underneath it, and a
// tick left on a row nobody can see would put a label on the print sheet the
// screen never showed. Widening the view is the case this gets right for free:
// the ticked rows are still there, so they stay ticked.
export function keepVisibleSelection(selected: number[], visibleIds: number[]): number[] {
  const onScreen = new Set(visibleIds)
  const kept = selected.filter((id) => onScreen.has(id))

  // The same array when nothing left the screen, so re-reading the same page
  // does not count as a change in state.
  return kept.length === selected.length ? selected : kept
}

export function labelListPage(query: LabelQuery): number {
  return Math.floor(Math.max(query.offset, 0) / LABEL_PAGE_SIZE) + 1
}

export function withLabelFilter(query: LabelQuery, changes: Partial<LabelQuery>): LabelQuery {
  // Any filter change goes back to the first page: staying on page 4 of a
  // result set that now has one shows an empty screen that reads as "nothing
  // here" when the truth is "you are past the end".
  return { ...query, ...changes, offset: 0 }
}

// Fifty at a time, because that is the server's cap on one redraw. Batching is
// the screen's business: somebody who ticked every label on the page asked for
// all of them, not for the first fifty.
export function refreshBatches(labelIds: number[]): number[][] {
  const batches: number[][] = []
  for (let index = 0; index < labelIds.length; index += REFRESH_BATCH_SIZE) {
    batches.push(labelIds.slice(index, index + REFRESH_BATCH_SIZE))
  }

  return batches
}

// An unknown template in a stale link is dropped rather than sent on: the API
// answers 400 for one, and an error screen is a poor answer to an old bookmark.
function readTemplate(value: null | string): null | string {
  const trimmed = value?.trim()
  if (!trimmed) return null

  return TEMPLATE_OPTIONS.some((option) => option.value === trimmed) ? trimmed : null
}
