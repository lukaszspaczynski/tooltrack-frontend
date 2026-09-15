import { useQuery } from '@tanstack/react-query'

import { fetchCaseImportSources } from '../../api/cases'
import type { CaseImportSource } from '../../api/types'

// Which pages this server can read a case from.
//
// A different list from the item one, and a shorter one: a page that sells
// drills has nothing to say about a box, so the server keeps two registries and
// a dialog asking where this case is from never offers one of the wrong kind.
//
// Asked again whenever a screen that offers them opens, for the same reason the
// item list is: it changes when the server learns a new maker, and a tab left
// open since before that would go on offering the old one.
export function useCaseImportSources(enabled: boolean): { sources: CaseImportSource[] } {
  const query = useQuery({
    queryKey: ['case-import-sources'],
    queryFn: fetchCaseImportSources,
    enabled,
    refetchOnMount: 'always',
    staleTime: 0,
  })

  return { sources: query.data?.sources ?? [] }
}

// Whether an address is one of them, checked here as well as on the server:
// here so nobody waits for a round trip to be told, there because that is where
// it is true.
export function isKnownCaseSource(url: string, sources: { host: string }[]): boolean {
  let parsed: URL
  try {
    parsed = new URL(url.trim())
  } catch {
    return false
  }

  if (parsed.protocol !== 'https:' && parsed.protocol !== 'http:') return false

  const host = parsed.hostname.toLowerCase().replace(/^www\./, '')

  return sources.some((source) => source.host.replace(/^www\./, '') === host)
}
