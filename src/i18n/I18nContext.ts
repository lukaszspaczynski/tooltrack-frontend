import { createContext, use } from 'react'

import type { Lang } from './lang'

export type LanguageChoice = {
  lang: Lang
  setLang: (lang: Lang) => void
}

// Split from the provider for the same reason the session's context is: a file
// exporting both a component and a constant breaks Fast Refresh.
export const LanguageContext = createContext<null | LanguageChoice>(null)

export function useLanguage(): LanguageChoice {
  const choice = use(LanguageContext)
  if (!choice) throw new Error('useLanguage must be used inside <I18nProvider>')
  return choice
}
