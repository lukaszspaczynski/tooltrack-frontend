import type { QueryClient } from '@tanstack/react-query'

import {
  addAttribute,
  deleteAttribute,
  fetchAttributeNames,
  updateAttribute,
} from '../../api/tools'
import type { ToolDetail } from '../../api/types'
import type { AttributeApi } from './components/AttributePanel'

// What the shared panel needs to edit a tool's spec sheet.
export const TOOL_ATTRIBUTE_API: AttributeApi<{ tool: ToolDetail }> = {
  add: addAttribute,
  cache: async (queryClient: QueryClient, toolId, { tool }) => {
    queryClient.setQueryData(['tool', toolId], { tool })
    await queryClient.invalidateQueries({ queryKey: ['tool-attribute-names'] })
  },
  names: fetchAttributeNames,
  namesKey: 'tool-attribute-names',
  remove: deleteAttribute,
  update: updateAttribute,
}
