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
