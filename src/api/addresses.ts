import { request } from './client'
import type { Address, AddressFields, AddressPage } from './types'

export type AddressQuery = {
  limit: number
  offset: number
  search: null | string
  sort: 'city' | 'name' | 'items'
}

export function fetchAddresses(query: AddressQuery): Promise<AddressPage> {
  const search = new URLSearchParams()
  if (query.search) search.set('q', query.search)
  search.set('sort', query.sort)
  // Most-used first is the only useful direction for that one; alphabetical is
  // the only useful direction for the other two.
  if (query.sort === 'items') search.set('order', 'desc')
  search.set('limit', String(query.limit))
  if (query.offset > 0) search.set('offset', String(query.offset))

  return request('/addresses', { search })
}

export function fetchAddress(id: number): Promise<{ address: Address }> {
  return request(`/addresses/${id}`)
}

export function createAddress(fields: AddressFields): Promise<{ address: Address }> {
  return request('/addresses', { body: fields, method: 'POST' })
}

export function updateAddress(
  id: number,
  patch: Partial<AddressFields>,
): Promise<{ address: Address }> {
  return request(`/addresses/${id}`, { body: patch, method: 'PATCH' })
}

// The items and arrangements that were there stay in the catalog and lose only
// their location, which is why the answer counts them: a confirmation that says
// "delete" and not "and forty cards stop saying where they are" is a
// confirmation somebody agrees to without knowing what they agreed to.
export function deleteAddress(
  id: number,
): Promise<{ cleared: { organizers: number; items: number }; ok: true }> {
  return request(`/addresses/${id}`, { method: 'DELETE' })
}
