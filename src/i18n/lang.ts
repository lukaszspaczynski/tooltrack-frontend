// Which language the interface speaks, and the rules for saying things in it.
//
// Pure, and tested next door: the plural rules are the part somebody notices
// when they are wrong, and they are worth arguing with in a test rather than
// by clicking through the screens.
//
// The key of every phrase is the Polish phrase itself. There is no `labels.
// title.header` to invent, look up or keep in step, a phrase that has not been
// translated yet shows in Polish rather than as a raw key, and the code still
// reads as the screen reads. `catalog.ts` holds the English side.

export const LANGS = ['pl', 'en'] as const

export type Lang = (typeof LANGS)[number]

export const LANG_NAMES: Record<Lang, string> = {
  en: 'English',
  pl: 'Polski',
}

// A count in three Polish forms and two English ones: one, few, many. English
// repeats its plural in the third slot, which keeps one shape for both tables.
export type CountForms = Record<Lang, readonly [string, string, string]>

export function isLang(value: unknown): value is Lang {
  return typeof value === 'string' && (LANGS as readonly string[]).includes(value)
}

// What was chosen last, or what the browser asks for, or Polish. The crew this
// is built for reads Polish; a browser set to anything else is the reason the
// English side exists at all.
export function preferredLang(stored: null | string, requested: readonly string[] = []): Lang {
  if (isLang(stored)) return stored

  for (const tag of requested) {
    const base = tag.toLowerCase().split('-')[0]
    if (isLang(base)) return base
  }

  return 'pl'
}

// `{n}` and friends, filled in from an object. Formatting a number goes through
// the language too: a thousand is "1000" in neither locale's typography.
export function interpolate(
  text: string,
  lang: Lang,
  vars: Record<string, number | string> = {},
): string {
  return text.replace(/\{(\w+)\}/g, (whole, name: string) => {
    const value = vars[name]
    if (value === undefined) return whole

    return typeof value === 'number' ? formatNumber(value, lang) : value
  })
}

// Polish picks a form by the last two digits and the teens are the exception:
// 12 is "narzędzi", 22 is "narzędzia". English only asks whether there is one.
export function pluralIndex(lang: Lang, count: number): 0 | 1 | 2 {
  const n = Math.abs(count)

  if (lang === 'en') return n === 1 ? 0 : 1

  if (n === 1) return 0

  const lastTwo = n % 100
  if (lastTwo >= 12 && lastTwo <= 14) return 2

  const last = n % 10
  return last >= 2 && last <= 4 ? 1 : 2
}

export function countLabel(lang: Lang, forms: CountForms, count: number): string {
  return `${formatNumber(count, lang)} ${forms[lang][pluralIndex(lang, count)]}`
}

export function formatNumber(value: number, lang: Lang): string {
  return new Intl.NumberFormat(locale(lang)).format(value)
}

export function formatDate(iso: string, lang: Lang): string {
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return '—'

  return new Intl.DateTimeFormat(locale(lang), {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(date)
}

// Upper case is not one operation for every language: Polish has letters the
// default mapping gets wrong, and a label drawn in caps is read off a box.
export function upperCase(text: string, lang: Lang): string {
  return text.toLocaleUpperCase(locale(lang))
}

export function locale(lang: Lang): string {
  return lang === 'pl' ? 'pl-PL' : 'en-GB'
}
