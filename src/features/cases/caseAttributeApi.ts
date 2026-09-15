import type { QueryClient } from '@tanstack/react-query'

import {
  addCaseAttribute,
  deleteCaseAttribute,
  fetchCaseAttributeNames,
  updateCaseAttribute,
} from '../../api/cases'
import type { ToolCase } from '../../api/types'
import type { AttributeApi } from '../items/components/AttributePanel'

// The same wiring for a case. The suggestion list is its own — a box and a
// drill have nothing in common on a spec sheet, and offering "napięcie
// sieciowe" to somebody labelling a case would be noise.
export const CASE_ATTRIBUTE_API: AttributeApi<{ case: ToolCase }> = {
  add: addCaseAttribute,
  cache: async (queryClient: QueryClient, caseId, answer) => {
    queryClient.setQueryData(['case', caseId], answer)
    await queryClient.invalidateQueries({ queryKey: ['case-attribute-names'] })
  },
  names: fetchCaseAttributeNames,
  namesKey: 'case-attribute-names',
  remove: deleteCaseAttribute,
  update: updateCaseAttribute,
}
