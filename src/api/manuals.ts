import { request } from './client'
import type { Manual } from './types'

// The manuals of one tool. Three ways in, because that is how a PDF actually
// reaches somebody: the file is on this laptop, it is one link away on the
// maker's website, or it is on the product page the card came from.

export function fetchManuals(toolId: number): Promise<{ manuals: Manual[] }> {
  return request(`/tools/${toolId}/manuals`)
}

// The file as the body of the request, like a photo upload: no FormData, no
// multipart. The name rides along in the query so the card can call it
// something before anybody types a title.
export async function uploadManual(toolId: number, file: File): Promise<{ manual: Manual }> {
  const search = new URLSearchParams({ name: file.name })
  const response = await fetch(`/api/tools/${toolId}/manuals?${search}`, {
    body: file,
    credentials: 'include',
    headers: { 'content-type': 'application/pdf' },
    method: 'POST',
  })

  const answer = (await response.json()) as { error?: string; manual: Manual }
  if (!response.ok) throw new Error(answer.error ?? 'Upload failed')

  return answer
}

export function importManualFromUrl(
  toolId: number,
  url: string,
  title?: string,
): Promise<{ manual: Manual }> {
  return request(`/tools/${toolId}/manuals`, { body: { title, url }, method: 'POST' })
}

// Everything a product page offers, at once. The card usually knows the
// address already — it is the Referencja parameter an import leaves behind.
export function importManualsFromPage(
  toolId: number,
  url: string,
): Promise<{ failed: { error: string; url: string }[]; manuals: Manual[] }> {
  return request(`/tools/${toolId}/manuals/from-page`, { body: { url }, method: 'POST' })
}

export function renameManual(
  toolId: number,
  manualId: number,
  title: string,
): Promise<{ manual: Manual }> {
  return request(`/tools/${toolId}/manuals/${manualId}`, { body: { title }, method: 'PATCH' })
}

export function deleteManual(toolId: number, manualId: number): Promise<{ ok: true }> {
  return request(`/tools/${toolId}/manuals/${manualId}`, { method: 'DELETE' })
}
