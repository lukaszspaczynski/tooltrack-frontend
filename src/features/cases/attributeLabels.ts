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
