import assert from 'node:assert/strict'
import test from 'node:test'

import { ITEM_CONDITIONS } from '../../api/types'
import {
  CONDITION_COLORS,
  CONDITION_LABELS,
  conditionOptions,
  formatDateTime,
  itemCountLabel,
  itemSubtitle,
} from './presentation'

test('every condition the API can send has a label and a colour', () => {
  for (const condition of ITEM_CONDITIONS) {
    assert.ok(CONDITION_LABELS[condition], condition)
    assert.ok(CONDITION_COLORS[condition], condition)
  }

  assert.equal(conditionOptions().length, ITEM_CONDITIONS.length)
})

test('the subtitle drops the fields that were left empty', () => {
  assert.equal(
    itemSubtitle({ brand: maker('Makita'), model: 'HR2470', serialNumber: '12345-AB' }),
    'Makita · HR2470 · nr 12345-AB',
  )
  assert.equal(itemSubtitle({ brand: maker('Makita'), model: '', serialNumber: '' }), 'Makita')
  // Nothing filled in reads as nothing, not as a row of separators.
  assert.equal(itemSubtitle({ brand: null, model: '', serialNumber: '' }), '')
})

test('the count is written in the right Polish form', () => {
  assert.equal(itemCountLabel(1), '1 narzędzie')
  assert.equal(itemCountLabel(2), '2 narzędzia')
  assert.equal(itemCountLabel(4), '4 narzędzia')
  assert.equal(itemCountLabel(5), '5 narzędzi')
  assert.equal(itemCountLabel(0), '0 narzędzi')
  // The teens are the exception: 12 is "narzędzi", 22 is "narzędzia".
  assert.equal(itemCountLabel(12), '12 narzędzi')
  assert.equal(itemCountLabel(13), '13 narzędzi')
  assert.equal(itemCountLabel(22), '22 narzędzia')
  assert.equal(itemCountLabel(112), '112 narzędzi')
  assert.equal(itemCountLabel(122), '122 narzędzia')
})

test('an unusable timestamp shows a dash instead of "Invalid Date"', () => {
  assert.equal(formatDateTime('nie-data'), '—')
  assert.match(formatDateTime('2026-01-02T10:30:00.000Z'), /2026/)
})

// The maker is a row now, not a string. A card with none is normal — most hand
// tools have no maker worth recording — and reads as null rather than as a
// maker called nothing.
function maker(name: string) {
  return { color: '', id: 1, name }
}
