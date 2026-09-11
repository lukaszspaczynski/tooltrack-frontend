import { request } from './client'
import type {
  CardPhoto,
  CutoutParams,
  CutoutPreviewResponse,
  Photo,
  PhotoLibraryPage,
  PhotoOwner,
  PhotoSearchResult,
} from './types'

// /api/tools/7/photos or /api/cases/7/photos — the same routes, the same
// server handler, and the only place this app turns an owner into a path.
function ownerPath(owner: PhotoOwner): string {
  return `/${owner.kind === 'case' ? 'cases' : 'tools'}/${owner.id}`
}

export type PhotoImportItem = {
  attribution?: string
  url: string
}

export type PhotoImportResult = {
  failed: { error: string; url: string }[]
  photos: CardPhoto[]
}

export function fetchPhotos(owner: PhotoOwner): Promise<{ photos: CardPhoto[] }> {
  return request(`${ownerPath(owner)}/photos`)
}

// The file goes up as the body of the request with its own content type — no
// FormData, no multipart. The API takes the bytes and decides for itself what
// they are; the browser's idea of the type is only a hint.
export async function uploadPhoto(owner: PhotoOwner, file: File): Promise<{ photo: CardPhoto }> {
  const response = await fetch(`/api${ownerPath(owner)}/photos`, {
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

  return payload as { photo: CardPhoto }
}

// One pasted address or a batch ticked in the suggestions — the same endpoint,
// because saving three is saving one, three times.
export function importPhotos(
  owner: PhotoOwner,
  items: PhotoImportItem[],
): Promise<PhotoImportResult> {
  return request(`${ownerPath(owner)}/photos`, { body: { items }, method: 'POST' })
}

// Runs the cutout and shows it without keeping it. The result lives on the
// server until it is committed or forgotten.
export function previewCutout(
  owner: PhotoOwner,
  photoId: number,
  params: CutoutParams,
): Promise<CutoutPreviewResponse> {
  return request(`${ownerPath(owner)}/photos/${photoId}/cutout/preview`, {
    body: params,
    method: 'POST',
  })
}

// Keeps a preview. The bytes are already on the server; this is what turns
// them into a photo of the tool.
export function commitCutout(
  owner: PhotoOwner,
  photoId: number,
  checksum: string,
): Promise<{ photo: CardPhoto }> {
  return request(`${ownerPath(owner)}/photos/${photoId}/cutout/commit`, {
    body: { checksum },
    method: 'POST',
  })
}

export function setPrimaryPhoto(owner: PhotoOwner, photoId: number): Promise<{ photo: CardPhoto }> {
  return request(`${ownerPath(owner)}/photos/${photoId}`, {
    body: { isPrimary: true },
    method: 'PATCH',
  })
}

export function deletePhoto(owner: PhotoOwner, photoId: number): Promise<{ ok: true }> {
  return request(`${ownerPath(owner)}/photos/${photoId}`, { method: 'DELETE' })
}

// On demand only: this costs the server an API call to a search provider, so
// it is never part of loading the page.
export function fetchPhotoSuggestions(
  owner: PhotoOwner,
  query?: string,
): Promise<PhotoSearchResult> {
  const search = new URLSearchParams()
  if (query?.trim()) search.set('q', query.trim())

  return request(`${ownerPath(owner)}/photo-suggestions`, { search })
}

export type LibraryQuery = {
  // Null means both: photos on a card and photos still waiting for one.
  assigned: boolean | null
  limit: number
  offset: number
  search: null | string
  source: null | string
}

// Every photo in the system, not one card's. Its own endpoint because it is
// its own question: what did we import, rather than what does this tool or
// this case look like.
export function fetchPhotoLibrary(query: LibraryQuery): Promise<PhotoLibraryPage> {
  const search = new URLSearchParams()
  if (query.search) search.set('q', query.search)
  if (query.source) search.set('source', query.source)
  if (query.assigned !== null) search.set('assigned', String(query.assigned))
  search.set('limit', String(query.limit))
  if (query.offset > 0) search.set('offset', String(query.offset))

  return request('/photos', { search })
}

// An upload that belongs to no card. Pictures arrive before anyone decides
// what they are; the library is where they wait. Bytes already on the server
// answer with the picture that is there.
export async function uploadLibraryPhoto(file: File): Promise<{ photo: Photo }> {
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

  return payload as { photo: Photo }
}

// The same picture, fetched by the server rather than sent from a phone. A
// logo or a manual is as likely to be a link somebody has as a file.
//
// `created` is false when those bytes were already here: the picture comes
// back either way, because it is the same photograph, but the screen should
// not claim to have added a row it did not add.
export function importLibraryPhoto(url: string): Promise<{ created: boolean; photo: Photo }> {
  return request('/photos', { body: { url }, method: 'POST' })
}

export type AttachResult = {
  failed: { id: number; reason: string }[]
  photos: CardPhoto[]
}

// Puts pictures that already exist on a card. One insert each: nothing moves
// and nothing is copied, because a picture can be on several cards at once.
export function attachPhotos(owner: PhotoOwner, photoIds: number[]): Promise<AttachResult> {
  return request(`${ownerPath(owner)}/photos/attach`, { body: { photoIds }, method: 'POST' })
}

export type BulkDeleteResult = {
  deleted: number
  // Cards whose main photo was among the deleted ones and now show another.
  promoted: PhotoOwner[]
  requested: number
}

export function deletePhotos(ids: number[]): Promise<BulkDeleteResult> {
  return request('/photos/delete', { body: { ids }, method: 'POST' })
}
