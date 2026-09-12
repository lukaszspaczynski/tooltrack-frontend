import { request } from './client'
import type { Organizer, OrganizerFields, OrganizerLabelSlot, OrganizerPage } from './types'

export type OrganizerQuery = {
  caseId: null | number
  limit: number
  offset: number
  search: null | string
}

export function fetchOrganizers(query: OrganizerQuery): Promise<OrganizerPage> {
  const search = new URLSearchParams()
  if (query.search) search.set('q', query.search)
  if (query.caseId !== null) search.set('caseId', String(query.caseId))
  search.set('limit', String(query.limit))
  if (query.offset > 0) search.set('offset', String(query.offset))

  return request('/organizers', { search })
}

// Every organizer a case is in. The case's delete confirmation asks with this,
// because deleting the box takes the arrangements with it.
export function fetchOrganizersOfCase(caseId: number): Promise<OrganizerPage> {
  return fetchOrganizers({ caseId, limit: 200, offset: 0, search: null })
}

// The wizard's last step: the case, the name and the tools that were ticked,
// in one request — a half-made organizer cannot exist because somebody closed
// the tab between two of them.
export function fetchOrganizer(id: number): Promise<{ organizer: Organizer }> {
  return request(`/organizers/${id}`)
}

export function createOrganizer(fields: OrganizerFields): Promise<{ organizer: Organizer }> {
  return request('/organizers', { body: fields, method: 'POST' })
}

// Any of name, description, number or caseId. The case cannot be cleared: an
// arrangement of nothing is not an arrangement.
export function updateOrganizer(
  id: number,
  patch: Partial<Pick<OrganizerFields, 'caseId' | 'description' | 'name' | 'number'>>,
): Promise<{ organizer: Organizer }> {
  return request(`/organizers/${id}`, { body: patch, method: 'PATCH' })
}

// Puts more tools into an existing arrangement. 409 when one of them is
// already somewhere else — moving it is a decision somebody has to make.
export function addToolsToOrganizer(
  id: number,
  toolIds: number[],
): Promise<{ organizer: Organizer }> {
  return request(`/organizers/${id}/tools`, { body: { toolIds }, method: 'POST' })
}

// The sizes this organizer's case has places for. The wizard offers these and
// nothing else: a label printed at a size the box has no place for is a label
// nobody can stick anywhere.
export function fetchLabelSlots(id: number): Promise<{ slots: OrganizerLabelSlot[] }> {
  return request(`/organizers/${id}/label-slots`)
}

export type LabelRequest = {
  photoIds?: number[]
  // A print-ready file has a margin, crop marks and a measured bar; a plain one
  // is the artwork alone. Defaults to print-ready on the server.
  printReady?: boolean
  slotId: number
  template: 'contents' | 'number'
  withLogos?: boolean
  withNames?: boolean
  withTitle?: boolean
}

// Draws one and keeps it. The whole organizer comes back, labels included.
export function createLabel(id: number, body: LabelRequest): Promise<{ organizer: Organizer }> {
  return request(`/organizers/${id}/labels`, { body, method: 'POST' })
}

export function deleteLabel(id: number, labelId: number): Promise<{ organizer: Organizer }> {
  return request(`/organizers/${id}/labels/${labelId}`, { method: 'DELETE' })
}

export function deleteOrganizer(id: number): Promise<{ ok: true }> {
  return request(`/organizers/${id}`, { method: 'DELETE' })
}

// Takes one tool out of an arrangement. The tool itself is untouched; it
// simply lies nowhere until somebody puts it somewhere.
export function removeToolFromOrganizer(id: number, toolId: number): Promise<{ ok: true }> {
  return request(`/organizers/${id}/tools/${toolId}`, { method: 'DELETE' })
}
