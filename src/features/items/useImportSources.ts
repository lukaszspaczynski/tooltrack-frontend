import { useQuery } from '@tanstack/react-query'

import { fetchImportSources } from '../../api/items'
import type { ImportSource } from '../../api/types'

// Which pages this server can read, and which of them publish documents.
//
// Asked again whenever a screen that offers them opens. It was cached for an
// hour once, and the hour was the bug: the list changes when the server learns
// a new shop, and a tab left open since before that goes on offering the old
// two. The call is one small answer on a dialog somebody opens rarely, so
// there is nothing to save by remembering it.
export function useImportSources(enabled: boolean): {
  manualSources: ImportSource[]
  sources: ImportSource[]
} {
  const query = useQuery({
    queryKey: ['item-import-sources'],
    queryFn: fetchImportSources,
    enabled,
    refetchOnMount: 'always',
    staleTime: 0,
  })

  const sources = query.data?.sources ?? []

  return {
    // A shop that sells the item is not obliged to host its manual, and most do
    // not: a screen asking for one offers only the pages that have any.
    manualSources: sources.filter((source) => source.manuals),
    sources,
  }
}

// Whether an address is one of them, checked here as well as on the server:
// here so nobody waits for a round trip to be told, there because that is where
// it is true. Shared by every dialog that takes an address — the one importing
// a drill and the one importing a box are the same question now that there is
// one registry.
export function isKnownSource(url: string, sources: { host: string }[]): boolean {
  let parsed: URL
  try {
    parsed = new URL(url.trim())
  } catch {
    return false
  }

  if (parsed.protocol !== 'https:' && parsed.protocol !== 'http:') return false

  const host = parsed.hostname.toLowerCase().replace(/^www\./, '')

  return sources.some((source) => host === source.host.toLowerCase().replace(/^www\./, ''))
}
