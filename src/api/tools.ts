import { request } from './client'
import type { AttributeNameCount, CategoryCount, ToolDetail, ToolFields, ToolPage } from './types'

export type ToolQuery = {
  category: null | string
  condition: null | string
  direction: 'asc' | 'desc'
  // false: only tools that are in no organizer, which is what the organizer
  // wizard offers. Absent means "do not filter".
  inOrganizer?: boolean
  limit: number
  offset: number
  search: null | string
  sort: string
}

// The query object is turned into the exact parameters documented in
// Backend/docs/api.md. Empty filters are left out entirely rather than sent as
// blank, so the request URL says what is actually being asked.
export function toolSearchParams(query: ToolQuery): URLSearchParams {
  const params = new URLSearchParams()

  if (query.search) params.set('q', query.search)
  if (query.category) params.set('category', query.category)
  if (query.condition) params.set('condition', query.condition)
  if (query.inOrganizer !== undefined) params.set('inOrganizer', String(query.inOrganizer))
  params.set('sort', query.sort)
  params.set('order', query.direction)
  params.set('limit', String(query.limit))
  if (query.offset > 0) params.set('offset', String(query.offset))

  return params
}

export function fetchTools(query: ToolQuery): Promise<ToolPage> {
  return request('/tools', { search: toolSearchParams(query) })
}

export function fetchTool(id: number): Promise<{ tool: ToolDetail }> {
  return request(`/tools/${id}`)
}

export function fetchCategories(): Promise<{ categories: CategoryCount[] }> {
  return request('/tools/categories')
}

export function createTool(fields: ToolFields): Promise<{ tool: ToolDetail }> {
  return request('/tools', { body: fields, method: 'POST' })
}

export function updateTool(id: number, patch: Partial<ToolFields>): Promise<{ tool: ToolDetail }> {
  return request(`/tools/${id}`, { body: patch, method: 'PATCH' })
}

// Another card just like this one. The server copies the fields and the
// photo links; the serial number starts blank, because it identifies one
// physical machine.
export function duplicateTool(id: number): Promise<{ tool: ToolDetail }> {
  return request(`/tools/${id}/duplicate`, { method: 'POST' })
}

// The parameters of one tool. Each call answers with the whole card rather
// than the row that changed, so the screen replaces what it holds instead of
// merging one row into it.
export function addAttribute(
  toolId: number,
  attribute: { name: string; value: string },
): Promise<{ tool: ToolDetail }> {
  return request(`/tools/${toolId}/attributes`, { body: attribute, method: 'POST' })
}

export function updateAttribute(
  toolId: number,
  attributeId: number,
  patch: { name?: string; value?: string },
): Promise<{ tool: ToolDetail }> {
  return request(`/tools/${toolId}/attributes/${attributeId}`, { body: patch, method: 'PATCH' })
}

export function deleteAttribute(
  toolId: number,
  attributeId: number,
): Promise<{ tool: ToolDetail }> {
  return request(`/tools/${toolId}/attributes/${attributeId}`, { method: 'DELETE' })
}

// What other cards already call the same thing, most used first. Offered while
// somebody types a parameter name, so the catalog ends up with one spelling of
// "napięcie sieciowe" rather than four.
export function fetchAttributeNames(): Promise<{ names: AttributeNameCount[] }> {
  return request('/tools/attributes')
}

export function deleteTool(id: number): Promise<{ ok: true }> {
  return request(`/tools/${id}`, { method: 'DELETE' })
}
