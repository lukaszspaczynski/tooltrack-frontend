import { request } from './client'
import type {
  AttributeNameCount,
  CategoryCount,
  ItemKind,
  ImportSource,
  ItemDetail,
  ItemFields,
  ItemImportResult,
  ItemPage,
  ModelCount,
} from './types'

export type ItemQuery = {
  // Whether each card should carry its spec sheet. The boxes grid needs it —
  // the measurements and what goes in are what somebody is choosing between —
  // and nothing else does.
  attributes?: boolean
  category: null | string
  condition: null | string
  // Which sort to list, or null for all of them. The catalog holds tools and
  // appliances on the same card; a screen shows one at a time when asked.
  kind?: ItemKind | null
  direction: 'asc' | 'desc'
  // false: only items that are in no organizer, which is what the organizer
  // wizard offers. Absent means "do not filter".
  inOrganizer?: boolean
  // Exact model, as the cards spell it. A filter picked from a list rather than
  // typed, which is what the boxes screen is read by: a workshop owns nine of
  // the same Qbrick and one of everything else.
  model?: null | string
  limit: number
  offset: number
  search: null | string
  sort: string
}

// The query object is turned into the exact parameters documented in
// Backend/docs/api.md. Empty filters are left out entirely rather than sent as
// blank, so the request URL says what is actually being asked.
export function itemSearchParams(query: ItemQuery): URLSearchParams {
  const params = new URLSearchParams()
  if (query.kind) params.set('kind', query.kind)
  if (query.attributes) params.set('attributes', '1')

  if (query.search) params.set('q', query.search)
  if (query.category) params.set('category', query.category)
  if (query.model) params.set('model', query.model)
  if (query.condition) params.set('condition', query.condition)
  if (query.inOrganizer !== undefined) params.set('inOrganizer', String(query.inOrganizer))
  params.set('sort', query.sort)
  params.set('order', query.direction)
  params.set('limit', String(query.limit))
  if (query.offset > 0) params.set('offset', String(query.offset))

  return params
}

export function fetchItems(query: ItemQuery): Promise<ItemPage> {
  return request('/items', { search: itemSearchParams(query) })
}

export function fetchItem(id: number): Promise<{ item: ItemDetail }> {
  return request(`/items/${id}`)
}

export function fetchCategories(): Promise<{ categories: CategoryCount[] }> {
  return request('/items/categories')
}

// What the model filter offers, counted from the cards themselves. The boxes
// screen asks for `case`: one maker's range is what tells nine identical boxes
// apart from each other.
export function fetchModels(kind?: ItemKind): Promise<{ models: ModelCount[] }> {
  return request('/items/models', { search: kind ? new URLSearchParams({ kind }) : undefined })
}

// One more place a label goes on a box. The whole card comes back, so the
// screen does not have to merge a slot into a list it already holds — and a
// card that is not a case is refused by the server with ITEM_IS_NOT_A_CASE.
export function addLabelSlot(
  id: number,
  slot: { heightMm: number; widthMm: number },
): Promise<{ item: ItemDetail }> {
  return request(`/items/${id}/label-slots`, { body: slot, method: 'POST' })
}

export function removeLabelSlot(id: number, slotId: number): Promise<{ item: ItemDetail }> {
  return request(`/items/${id}/label-slots/${slotId}`, { method: 'DELETE' })
}

export function createItem(fields: ItemFields): Promise<{ item: ItemDetail }> {
  return request('/items', { body: fields, method: 'POST' })
}

export function updateItem(id: number, patch: Partial<ItemFields>): Promise<{ item: ItemDetail }> {
  return request(`/items/${id}`, { body: patch, method: 'PATCH' })
}

// Another card just like this one. The server copies the fields and the
// photo links; the serial number starts blank, because it identifies one
// physical machine.
export function duplicateItem(id: number): Promise<{ item: ItemDetail }> {
  return request(`/items/${id}/duplicate`, { method: 'POST' })
}

// The parameters of one item. Each call answers with the whole card rather
// than the row that changed, so the screen replaces what it holds instead of
// merging one row into it.
export function addAttribute(
  itemId: number,
  attribute: { name: string; value: string },
): Promise<{ item: ItemDetail }> {
  return request(`/items/${itemId}/attributes`, { body: attribute, method: 'POST' })
}

export function updateAttribute(
  itemId: number,
  attributeId: number,
  patch: { name?: string; value?: string },
): Promise<{ item: ItemDetail }> {
  return request(`/items/${itemId}/attributes/${attributeId}`, { body: patch, method: 'PATCH' })
}

export function deleteAttribute(
  itemId: number,
  attributeId: number,
): Promise<{ item: ItemDetail }> {
  return request(`/items/${itemId}/attributes/${attributeId}`, { method: 'DELETE' })
}

// What other cards already call the same thing, most used first. Offered while
// somebody types a parameter name, so the catalog ends up with one spelling of
// "napięcie sieciowe" rather than four.
export function fetchAttributeNames(): Promise<{ names: AttributeNameCount[] }> {
  return request('/items/attributes')
}

// Making a card out of a shop's product page. The answer carries the card and
// a tally of what came with it, because "imported" is a thing worth saying out
// loud: sixteen photographs and twelve parameters is the difference between
// this and typing the card by hand.
export function importItem(url: string): Promise<ItemImportResult> {
  return request('/items/import', { body: { url }, method: 'POST' })
}

// Reading the page again into a card that exists: the maker, the model, the
// category, the description, the spec sheet and the documents are overwritten;
// the name, the serial number, the condition and the photographs are not.
export function refreshToolFromPage(itemId: number, url: string): Promise<ItemImportResult> {
  return request(`/items/${itemId}/import`, { body: { url }, method: 'POST' })
}

// Which shops the server can read. Asked before the dialog offers to read one,
// so the screen never names a source this installation does not have.
export function fetchImportSources(): Promise<{ sources: ImportSource[] }> {
  return request('/items/import/sources')
}

export function deleteItem(id: number): Promise<{ ok: true }> {
  return request(`/items/${id}`, { method: 'DELETE' })
}
