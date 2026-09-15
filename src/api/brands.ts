import { request } from './client'
import type { Brand, BrandFields, BrandPage } from './types'

export type BrandQuery = {
  limit: number
  offset: number
  search: null | string
  sort: 'name' | 'items'
}

export function fetchBrands(query: BrandQuery): Promise<BrandPage> {
  const search = new URLSearchParams()
  if (query.search) search.set('q', query.search)
  search.set('sort', query.sort)
  if (query.sort === 'items') search.set('order', 'desc')
  search.set('limit', String(query.limit))
  if (query.offset > 0) search.set('offset', String(query.offset))

  return request('/brands', { search })
}

export function createBrand(fields: BrandFields): Promise<{ brand: Brand }> {
  return request('/brands', { body: fields, method: 'POST' })
}

export function updateBrand(id: number, patch: Partial<BrandFields>): Promise<{ brand: Brand }> {
  return request(`/brands/${id}`, { body: patch, method: 'PATCH' })
}

export function deleteBrand(id: number): Promise<{ ok: true }> {
  return request(`/brands/${id}`, { method: 'DELETE' })
}

// The logo is a picture that already exists — uploaded, fetched or cut out like
// any other — and this points the brand at it. One picture, one brand: the API
// answers 409 rather than moving a logo off another maker.
export function setBrandLogo(id: number, photoId: number): Promise<{ brand: Brand }> {
  return request(`/brands/${id}/logo`, { body: { photoId }, method: 'PUT' })
}

export function clearBrandLogo(id: number): Promise<{ brand: Brand }> {
  return request(`/brands/${id}/logo`, { method: 'DELETE' })
}
