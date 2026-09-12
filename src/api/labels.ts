import { request } from './client'
import type { LabelPage } from './types'

// Every label in the system, whichever organizer made it. The per-organizer
// calls live in `organizers.ts`; this is the shelf rather than the drawer, the
// same split as the photo library next to a card's gallery.
export type LabelQuery = {
  limit: number
  offset: number
  organizerId: null | number
  search: null | string
  template: null | string
}

export function fetchLabels(query: LabelQuery): Promise<LabelPage> {
  const search = new URLSearchParams()
  if (query.search) search.set('q', query.search)
  if (query.template) search.set('template', query.template)
  if (query.organizerId !== null) search.set('organizerId', String(query.organizerId))
  search.set('limit', String(query.limit))
  if (query.offset > 0) search.set('offset', String(query.offset))

  return request('/labels', { search })
}

// Draws the chosen labels again from the options they were kept with, across
// organizers. No organizer comes back, because a selection that spans them has
// no single one to send — the screen re-reads the list instead.
export function refreshAllLabels(
  labelIds: number[],
): Promise<{ failed: { error: string; id: number }[]; refreshed: number }> {
  return request('/labels/refresh', { body: { labelIds }, method: 'POST' })
}
