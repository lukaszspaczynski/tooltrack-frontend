import { request } from './client'
import type { SearchEnginesResponse, SearchProvider } from './types'

export const SEARCH_ENGINES_KEY = ['search-engines'] as const

export function fetchSearchEngines(): Promise<SearchEnginesResponse> {
  return request('/settings/search-engines')
}

// Global configuration — the server refuses this for anyone but an admin.
// An omitted field keeps what is stored; an empty string clears it, which is
// how a key is removed. The form never receives a key, so it never sends one
// back unless it was typed.
export function saveSearchEngine(
  provider: SearchProvider,
  changes: { apiKey?: string; apiSecret?: string; enabled?: boolean },
): Promise<SearchEnginesResponse> {
  return request(`/settings/search-engines/${provider}`, { body: changes, method: 'PATCH' })
}

// This account's own switch. Costs nobody anything to get wrong, so every user
// who may search owns theirs.
export function setMySearchEngine(
  provider: SearchProvider,
  enabled: boolean,
): Promise<SearchEnginesResponse> {
  return request(`/me/search-engines/${provider}`, { body: { enabled }, method: 'PATCH' })
}
