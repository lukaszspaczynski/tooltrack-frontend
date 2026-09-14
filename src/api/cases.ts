import { request } from './client'
import type {
  CaseFields,
  CaseImportResult,
  CaseImportSource,
  CasePage,
  SystemCount,
  ToolCase,
} from './types'

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

// Reading a maker's product page into a case. The answer carries the box and a
// tally of the photographs, because "imported" is worth saying out loud: seven
// pictures and nine measurements is the difference between this and typing it.
export function importCase(url: string): Promise<CaseImportResult> {
  return request('/cases/import', { body: { url }, method: 'POST' })
}

// The same page read again into a case that exists. The maker, the name, the
// system, every measurement and the note are overwritten; the label slots and
// the photographs are not — a slot is where a sticker goes on this box in this
// van, and no product page has an opinion about that.
export function refreshCaseFromPage(caseId: number, url: string): Promise<CaseImportResult> {
  return request(`/cases/${caseId}/import`, { body: { url }, method: 'POST' })
}

// Which pages the server can read a case from. Asked before the dialog offers
// to read one, so the screen never names a source this installation lacks.
export function fetchCaseImportSources(): Promise<{ sources: CaseImportSource[] }> {
  return request('/cases/import/sources')
}
