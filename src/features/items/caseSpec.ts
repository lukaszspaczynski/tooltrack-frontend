// What a box states, read off its spec sheet.
//
// A box has no fields of its own any more — it is a card like every other, and
// its measurements are parameters. Two of them are worth composing rather than
// listing: "450 × 322 × 126 mm" is three rows read as one measurement, which
// is the one thing the parameter panel cannot do for itself.
//
// It lives under items/ because there is no cases/ any more: the boxes are the
// catalog screen filtered to `kind=case`.

import type { ItemDetail } from '../../api/types'

// The parameter names this catalog writes for itself, and their English.
//
// A parameter name is free text: somebody types "napięcie sieciowe" and the
// card shows it back exactly as typed, because it is their sentence about
// their machine. Most names are like that and always will be.
//
// These are the exception. They are written by the importer and by the
// migration that turned a box's eleven measurement columns into rows, so the
// catalog chose the words rather than a person — and a screen showing
// "Długość zewnętrzna" to somebody reading in English is showing them a word
// the catalog picked and never translated.
//
// Polish is the key, as everywhere else here: an unknown name falls through
// `t()` unchanged, which is exactly right for one somebody typed. The table
// itself is what `i18n/catalog.test.ts` reads to know these need an English
// side, so a name added here without a translation fails the suite.
export const CASE_ATTRIBUTE_LABELS = {
  diagonal: 'Przekątna',
  ean: 'EAN',
  innerHeight: 'Wysokość wewnętrzna',
  innerLength: 'Długość wewnętrzna',
  innerWidth: 'Szerokość wewnętrzna',
  load: 'Ładowność',
  outerHeight: 'Wysokość zewnętrzna',
  outerLength: 'Długość zewnętrzna',
  outerWidth: 'Szerokość zewnętrzna',
  palletCount: 'Ilość na palecie',
  sku: 'SKU',
  volume: 'Pojemność',
  weight: 'Waga',
} as const

// What a box states, read off its spec sheet. These were typed fields until a
// box stopped being eleven columns: the name is the key and the value carries
// its unit — "450 mm" — so a screen reads them rather than formats them.
export function attributeValue(item: Pick<ItemDetail, 'attributes'>, name: string): string {
  return item.attributes.find((attribute) => attribute.name === name)?.value ?? ''
}

// "450 × 322 × 126 mm", or nothing at all.
//
// A partial set is shown as far as it goes rather than padded with question
// marks: two measurements out of three is still worth reading, and an invented
// third is not. The unit is written once at the end, which is why it is
// stripped from each value first.
function dimensions(item: Pick<ItemDetail, 'attributes'>, names: string[]): string {
  const parts = names.map((name) => attributeValue(item, name).replace(' mm', '')).filter(Boolean)
  if (parts.length === 0) return ''

  return `${parts.join(' × ')} mm`
}

export function outerDimensions(item: Pick<ItemDetail, 'attributes'>): string {
  return dimensions(item, [
    CASE_ATTRIBUTE_LABELS.outerLength,
    CASE_ATTRIBUTE_LABELS.outerWidth,
    CASE_ATTRIBUTE_LABELS.outerHeight,
  ])
}

export function innerDimensions(item: Pick<ItemDetail, 'attributes'>): string {
  return dimensions(item, [
    CASE_ATTRIBUTE_LABELS.innerLength,
    CASE_ATTRIBUTE_LABELS.innerWidth,
    CASE_ATTRIBUTE_LABELS.innerHeight,
  ])
}

// What goes in and what it carries — the two facts somebody choosing a box is
// choosing between.
export function capacity(item: Pick<ItemDetail, 'attributes'>): string {
  return attributeValue(item, CASE_ATTRIBUTE_LABELS.volume)
}

export function load(item: Pick<ItemDetail, 'attributes'>): string {
  return attributeValue(item, CASE_ATTRIBUTE_LABELS.load)
}
