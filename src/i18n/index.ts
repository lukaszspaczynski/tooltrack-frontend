// Saying things in the language somebody chose.
//
// `t` is a plain function rather than a hook, and the language lives in this
// module rather than in a context value. Two reasons: every screen in the app
// says something, so a hook would be one more line of ceremony in forty files;
// and a phrase is often needed where a hook cannot go — a lookup table, a
// column definition, a helper called from an event handler.
//
// What makes that safe is `I18nProvider`, which remounts the tree when the
// language changes. Switching language is a thing somebody does once, and a
// remount is the cheapest way to be certain nothing kept a phrase from before.

import { EN } from './catalog'
import {
  countLabel,
  formatDate,
  formatNumber,
  interpolate,
  upperCase,
  type CountForms,
  type Lang,
} from './lang'

const STORAGE_KEY = 'tooltrack.lang'

// The language lives here rather than in React state, and React subscribes to
// it: `t` has to be readable from a lookup table and an event handler, and the
// account's own language arrives from a query rather than from a click.
let current: Lang = 'pl'

const listeners = new Set<() => void>()

export function getLang(): Lang {
  return current
}

export function subscribeToLang(listener: () => void): () => void {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

export function setLang(lang: Lang): void {
  if (lang === current) return

  current = lang
  document.documentElement.lang = lang

  try {
    localStorage.setItem(STORAGE_KEY, lang)
  } catch {
    // A browser refusing storage is a browser that asks again next time, which
    // is worse than remembering and not a reason to fail the switch.
  }

  for (const listener of listeners) listener()
}

export function storedLang(): null | string {
  try {
    return localStorage.getItem(STORAGE_KEY)
  } catch {
    return null
  }
}

// The Polish phrase is the key. Nothing in the catalog means nothing to
// translate — the phrase itself is shown, which is right in Polish and honest
// in English, where a raw key would be neither.
export function t(text: string, vars?: Record<string, number | string>): string {
  const phrase = current === 'pl' ? text : (EN[text] ?? text)

  return vars ? interpolate(phrase, current, vars) : phrase
}

// "3 narzędzia" is not "3 narzędzi", and it is not "3 items" either. The forms
// live in the catalog beside the phrases.
export function tCount(forms: CountForms, count: number): string {
  return countLabel(current, forms, count)
}

export function tDate(iso: string): string {
  return formatDate(iso, current)
}

export function tNumber(value: number): string {
  return formatNumber(value, current)
}

export function tUpper(text: string): string {
  return upperCase(text, current)
}

export { LANG_NAMES, LANGS, preferredLang, type Lang } from './lang'
export { COUNTS } from './catalog'
