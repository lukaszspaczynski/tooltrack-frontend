import { useSyncExternalStore } from 'react'

import { getLang, subscribeToLang, type Lang } from './index'

export type LanguageChoice = {
  lang: Lang
  setLang: (lang: Lang) => void
}

// No context: the language is an external store, and this is how React reads
// one. It also means the account's language can be adopted from outside the
// render tree — see AccountLanguage.tsx — without a setState in an effect.
export function useLanguage(): Lang {
  return useSyncExternalStore(subscribeToLang, getLang, getLang)
}
