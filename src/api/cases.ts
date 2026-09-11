import { request } from './client'
import type { CaseFields, CasePage, SystemCount, ToolCase } from './types'

export type CaseQuery = {
  limit: number
  manufacturer: null | string
  offset: number
  search: null | string
  sort: string
}

export function fetchCases(query: CaseQuery): Promise<CasePage> {
  const search = new URLSearchParams()
  if (query.search) search.set('q', query.search)
  if (query.manufacturer) search.set('manufacturer', query.manufacturer)
  search.set('sort', query.sort)
  search.set('limit', String(query.limit))
  if (query.offset > 0) search.set('offset', String(query.offset))

  return request('/cases', { search })
}

export function fetchCase(id: number): Promise<{ case: ToolCase }> {
  return request(`/cases/${id}`)
}

export function createCase(fields: CaseFields): Promise<{ case: ToolCase }> {
  return request('/cases', { body: fields, method: 'POST' })
}

// Any subset of the fields. An explicit null clears a measurement, which is
// why the form sends null rather than omitting an emptied input.
export function updateCase(id: number, patch: Partial<CaseFields>): Promise<{ case: ToolCase }> {
  return request(`/cases/${id}`, { body: patch, method: 'PATCH' })
}

export function deleteCase(id: number): Promise<{ ok: true }> {
  return request(`/cases/${id}`, { method: 'DELETE' })
}

// One more place a label goes. The whole case comes back, so the screen does
// not have to merge a slot into a list it already holds.
export function addLabelSlot(
  id: number,
  slot: { heightMm: number; widthMm: number },
): Promise<{ case: ToolCase }> {
  return request(`/cases/${id}/label-slots`, { body: slot, method: 'POST' })
}

export function removeLabelSlot(id: number, slotId: number): Promise<{ case: ToolCase }> {
  return request(`/cases/${id}/label-slots/${slotId}`, { method: 'DELETE' })
}

// What the system filter offers, counted from the cases themselves.
export function fetchSystems(): Promise<{ systems: SystemCount[] }> {
  return request('/cases/systems')
}
