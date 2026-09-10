import { request } from './client'
import type { PhotoSearchResult, ToolPhoto } from './types'

export type PhotoImportItem = {
  attribution?: string
  url: string
}

export type PhotoImportResult = {
  failed: { error: string; url: string }[]
  photos: ToolPhoto[]
}

export function fetchPhotos(toolId: number): Promise<{ photos: ToolPhoto[] }> {
  return request(`/tools/${toolId}/photos`)
}

// The file goes up as the body of the request with its own content type — no
// FormData, no multipart. The API takes the bytes and decides for itself what
// they are; the browser's idea of the type is only a hint.
export async function uploadPhoto(toolId: number, file: File): Promise<{ photo: ToolPhoto }> {
  const response = await fetch(`/api/tools/${toolId}/photos`, {
    body: file,
    credentials: 'include',
    headers: { 'content-type': file.type || 'application/octet-stream' },
    method: 'POST',
  })

  const payload = (await response.json().catch(() => null)) as null | Record<string, unknown>
  if (!response.ok) {
    throw new Error(
      typeof payload?.error === 'string' ? payload.error : 'Nie udało się wgrać zdjęcia',
    )
  }

  return payload as { photo: ToolPhoto }
}

// One pasted address or a batch ticked in the suggestions — the same endpoint,
// because saving three is saving one, three times.
export function importPhotos(toolId: number, items: PhotoImportItem[]): Promise<PhotoImportResult> {
  return request(`/tools/${toolId}/photos`, { body: { items }, method: 'POST' })
}

export function setPrimaryPhoto(toolId: number, photoId: number): Promise<{ photo: ToolPhoto }> {
  return request(`/tools/${toolId}/photos/${photoId}`, {
    body: { isPrimary: true },
    method: 'PATCH',
  })
}

export function deletePhoto(toolId: number, photoId: number): Promise<{ ok: true }> {
  return request(`/tools/${toolId}/photos/${photoId}`, { method: 'DELETE' })
}

// On demand only: this costs the server an API call to a search provider, so
// it is never part of loading the page.
export function fetchPhotoSuggestions(toolId: number, query?: string): Promise<PhotoSearchResult> {
  const search = new URLSearchParams()
  if (query?.trim()) search.set('q', query.trim())

  return request(`/tools/${toolId}/photo-suggestions`, { search })
}
