import type { ReactNode } from 'react'

import { preferredLang, setLang, storedLang } from './index'
import { useLanguage } from './useLanguage'

// The language is settled before anything renders, so no screen paints in one
// language and repaints in another. What the account says overrides this as
// soon as /auth/me answers; see AccountLanguage.tsx.
setLang(preferredLang(storedLang(), navigator.languages ?? [navigator.language]))

// Everything under here is remounted when the language changes — that is what
// the `key` is for. `t` is read during render, inside lookup tables and from
// event handlers, and remounting is the one way to be sure nothing kept a
// phrase from before. Switching language is something somebody does once.
export function I18nProvider({ children }: { children: ReactNode }) {
  const lang = useLanguage()

  return (
    <div key={lang} style={{ display: 'contents' }}>
      {children}
    </div>
  )
}
