import { useState, type ReactNode } from 'react'

import { LanguageContext } from './I18nContext'
import { getLang, preferredLang, setLang, storedLang, type Lang } from './index'

// The language is settled before anything renders, so no screen paints in one
// language and repaints in another.
setLang(preferredLang(storedLang(), navigator.languages ?? [navigator.language]))

// Everything under here is remounted when the language changes — that is what
// the `key` is for. `t` is read during render, inside lookup tables and from
// event handlers, and remounting is the one way to be sure nothing kept a
// phrase from before. Switching language is something somebody does once.
export function I18nProvider({ children }: { children: ReactNode }) {
  const [lang, choose] = useState<Lang>(getLang())

  return (
    <LanguageContext.Provider
      value={{
        lang,
        setLang: (next) => {
          setLang(next)
          choose(next)
        },
      }}
    >
      <div key={lang} style={{ display: 'contents' }}>
        {children}
      </div>
    </LanguageContext.Provider>
  )
}
