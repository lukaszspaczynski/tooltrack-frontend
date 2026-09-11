import { request } from './client'
import type { CategoryCount, Tool, ToolFields, ToolPage } from './types'

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

export function fetchTool(id: number): Promise<{ tool: Tool }> {
  return request(`/tools/${id}`)
}

export function fetchCategories(): Promise<{ categories: CategoryCount[] }> {
  return request('/tools/categories')
}

export function createTool(fields: ToolFields): Promise<{ tool: Tool }> {
  return request('/tools', { body: fields, method: 'POST' })
}

export function updateTool(id: number, patch: Partial<ToolFields>): Promise<{ tool: Tool }> {
  return request(`/tools/${id}`, { body: patch, method: 'PATCH' })
}

// Another card just like this one. The server copies the fields and the
// photo links; the serial number starts blank, because it identifies one
// physical machine.
export function duplicateTool(id: number): Promise<{ tool: Tool }> {
  return request(`/tools/${id}/duplicate`, { method: 'POST' })
}

export function deleteTool(id: number): Promise<{ ok: true }> {
  return request(`/tools/${id}`, { method: 'DELETE' })
}
