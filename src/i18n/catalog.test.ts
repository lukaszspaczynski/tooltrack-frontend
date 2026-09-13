import assert from 'node:assert/strict'
import { readdirSync, readFileSync, statSync } from 'node:fs'
import { dirname, join } from 'node:path'
import test from 'node:test'
import { fileURLToPath } from 'node:url'

import { EN } from './catalog'
import { countLabel, interpolate, preferredLang, pluralIndex, upperCase } from './lang'

const SRC = join(dirname(fileURLToPath(import.meta.url)), '..')

function sources(dir: string): string[] {
  return readdirSync(dir).flatMap((entry) => {
    const path = join(dir, entry)
    if (statSync(path).isDirectory()) return sources(path)
    return /\.tsx?$/.test(entry) && !entry.includes('.test.') ? [path] : []
  })
}

// Every phrase the screens ask for, as written in the source. A phrase missing
// from the catalog is not a crash — it shows in Polish — which is exactly why
// it needs a test: nothing else would ever point at it.
function phrasesInSource(): Map<string, string[]> {
  const found = new Map<string, string[]>()

  for (const path of sources(SRC)) {
    // The catalog is the answer, not a question; `lang.ts` holds the rules and
    // says nothing. Everything else, including the language menu, is a screen.
    if (path.endsWith(join('i18n', 'catalog.ts')) || path.endsWith(join('i18n', 'lang.ts'))) {
      continue
    }

    const source = readFileSync(path, 'utf8')

    for (const match of source.matchAll(/\bt\(\s*'((?:[^'\\]|\\.)+)'/g)) {
      const phrase = match[1].replace(/\\'/g, "'")
      found.set(phrase, [...(found.get(phrase) ?? []), path])
    }

    // A lookup table holds the Polish phrase and the screen translates it by
    // key — `t(CONDITION_LABELS[tool.condition])`. The phrase is never a
    // literal argument, so it has to be read out of the table itself.
    for (const table of source.matchAll(
      /(?:const|export const) \w*(?:LABELS|HINTS|OPTIONS|DESCRIPTIONS)\b[^\n]*\n([\s\S]*?)\n(?:\}|\])/g,
    )) {
      for (const entry of table[1].matchAll(/(?:^\s*|label: )(?:\w+: )?'((?:[^'\\]|\\.)+)'/gm)) {
        const phrase = entry[1].replace(/\\'/g, "'")
        if (/[ąćęłńóśźżĄĆĘŁŃÓŚŹŻ]/.test(phrase) || phrase in EN) {
          found.set(phrase, [...(found.get(phrase) ?? []), path])
        }
      }
    }
  }

  return found
}

test('every phrase on a screen has an English translation', () => {
  const missing = [...phrasesInSource().keys()].filter((phrase) => !(phrase in EN)).sort()

  assert.deepEqual(
    missing,
    [],
    `${missing.length} phrase(s) would stay Polish in English:\n${missing.join('\n')}`,
  )
})

test('the catalog holds nothing the screens no longer say', () => {
  // A phrase that has been reworded leaves its old translation behind, and the
  // next person to edit it translates something nobody reads.
  const used = phrasesInSource()
  const orphans = Object.keys(EN).filter((phrase) => !used.has(phrase))

  assert.deepEqual(orphans, [], `unused translations:\n${orphans.join('\n')}`)
})

test('Polish counts by the last two digits, English only by one', () => {
  const tools = {
    en: ['tool', 'tools', 'tools'],
    pl: ['narzędzie', 'narzędzia', 'narzędzi'],
  } as const

  assert.equal(countLabel('pl', tools, 1), '1 narzędzie')
  assert.equal(countLabel('pl', tools, 3), '3 narzędzia')
  assert.equal(countLabel('pl', tools, 5), '5 narzędzi')
  assert.equal(countLabel('pl', tools, 0), '0 narzędzi')
  // The teens are the exception: 12 is "narzędzi", 22 is "narzędzia".
  assert.equal(countLabel('pl', tools, 12), '12 narzędzi')
  assert.equal(countLabel('pl', tools, 22), '22 narzędzia')
  assert.equal(countLabel('pl', tools, 112), '112 narzędzi')

  assert.equal(countLabel('en', tools, 1), '1 tool')
  assert.equal(countLabel('en', tools, 0), '0 tools')
  assert.equal(countLabel('en', tools, 22), '22 tools')

  assert.equal(pluralIndex('pl', 2), 1)
  assert.equal(pluralIndex('en', 2), 1)
})

test('what was chosen beats what the browser asks for', () => {
  assert.equal(preferredLang('en', ['pl-PL']), 'en')
  assert.equal(preferredLang(null, ['en-GB', 'pl']), 'en')
  assert.equal(preferredLang(null, ['de-DE']), 'pl')
  assert.equal(preferredLang('klingon', []), 'pl')
  assert.equal(preferredLang(null, []), 'pl')
})

test('a phrase carries its numbers, in the language it is read in', () => {
  assert.equal(interpolate('Wybrano {n}', 'pl', { n: 3 }), 'Wybrano 3')
  assert.equal(interpolate('{name} — {n}', 'en', { n: 1, name: 'Skrzynka 4' }), 'Skrzynka 4 — 1')
  // Nothing to put there is left alone rather than blanked: a phrase reading
  // "Wybrano" is wrong, "Wybrano {n}" says which part is missing.
  assert.equal(interpolate('Wybrano {n}', 'pl', {}), 'Wybrano {n}')
})

test('capitals are not one operation for every language', () => {
  assert.equal(upperCase('ćwiartka', 'pl'), 'ĆWIARTKA')
  assert.equal(upperCase('quarter', 'en'), 'QUARTER')
})
