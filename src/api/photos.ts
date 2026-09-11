import { request } from './client'
import type {
  CutoutParams,
  CutoutPreviewResponse,
  PhotoLibraryPage,
  PhotoSearchResult,
  ToolPhoto,
} from './types'

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

// The AI edit: cut the tool out of this photo. It adds a photo rather than
// replacing one, so the original is always there to fall back on.
export function cutoutPhoto(
  toolId: number,
  photoId: number,
): Promise<{ photo: ToolPhoto; provider: string }> {
  return request(`/tools/${toolId}/photos/${photoId}/cutout`, { method: 'POST' })
}

// Runs the cutout and shows it without keeping it. The result lives on the
// server until it is committed or forgotten.
export function previewCutout(
  toolId: number,
  photoId: number,
  params: CutoutParams,
): Promise<CutoutPreviewResponse> {
  return request(`/tools/${toolId}/photos/${photoId}/cutout/preview`, {
    body: params,
    method: 'POST',
  })
}

// Keeps a preview. The bytes are already on the server; this is what turns
// them into a photo of the tool.
export function commitCutout(
  toolId: number,
  photoId: number,
  checksum: string,
): Promise<{ photo: ToolPhoto }> {
  return request(`/tools/${toolId}/photos/${photoId}/cutout/commit`, {
    body: { checksum },
    method: 'POST',
  })
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

export type LibraryQuery = {
  // Null means both: photos with a tool and photos still waiting for one.
  assigned: boolean | null
  limit: number
  offset: number
  search: null | string
  source: null | string
}

// Every photo in the system, not one tool's. Its own endpoint because it is
// its own question: what did we import, rather than what does this tool look
// like.
export function fetchPhotoLibrary(query: LibraryQuery): Promise<PhotoLibraryPage> {
  const search = new URLSearchParams()
  if (query.search) search.set('q', query.search)
  if (query.source) search.set('source', query.source)
  if (query.assigned !== null) search.set('assigned', String(query.assigned))
  search.set('limit', String(query.limit))
  if (query.offset > 0) search.set('offset', String(query.offset))

  return request('/photos', { search })
}

// An upload that belongs to no tool. Pictures arrive before anyone decides
// what they are; the library is where they wait.
export async function uploadLibraryPhoto(file: File): Promise<{ photo: ToolPhoto }> {
  const response = await fetch('/api/photos', {
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

export type AttachResult = {
  failed: { id: number; reason: string }[]
  photos: ToolPhoto[]
}

// Puts photos that already exist on a tool. An unattached one moves; one that
// belongs to another tool is copied, because the same picture can legitimately
// illustrate two tools.
export function attachPhotos(toolId: number, photoIds: number[]): Promise<AttachResult> {
  return request(`/tools/${toolId}/photos/attach`, { body: { photoIds }, method: 'POST' })
}

export type BulkDeleteResult = {
  deleted: number
  // Tools whose main photo was among the deleted ones and now show another.
  promotedTools: number[]
  requested: number
}

export function deletePhotos(ids: number[]): Promise<BulkDeleteResult> {
  return request('/photos/delete', { body: { ids }, method: 'POST' })
}
