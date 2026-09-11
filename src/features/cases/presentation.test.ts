import assert from 'node:assert/strict'
import test from 'node:test'

import { caseCountLabel, caseSubtitle, formatDimensions, formatNumber } from './presentation'

test('three measurements read as one line', () => {
  assert.equal(formatDimensions({ height: 240, length: 450, width: 331 }), '450 × 331 × 240 mm')
})

test('a partial set is shown as far as it goes', () => {
  // Two out of three is still worth reading; an invented third is not.
  assert.equal(formatDimensions({ height: null, length: 450, width: 331 }), '450 × 331 mm')
  assert.equal(formatDimensions({ height: null, length: null, width: null }), '')
})

test('litres and kilograms use a Polish comma and drop trailing zeroes', () => {
  assert.equal(formatNumber(4.5, 'L'), '4,5 L')
  assert.equal(formatNumber(19, 'L'), '19 L')
  assert.equal(formatNumber(null, 'kg'), '')
})

test('the subtitle drops what is missing instead of leaving a separator', () => {
  assert.equal(caseSubtitle({ manufacturer: 'Qbrick', system: 'PRO' }), 'Qbrick · PRO')
  // A case with no system must not read "Qbrick · ".
  assert.equal(caseSubtitle({ manufacturer: 'Qbrick', system: '' }), 'Qbrick')
})

test('Polish counts skrzynki by the last digits', () => {
  assert.equal(caseCountLabel(1), '1 skrzynka')
  assert.equal(caseCountLabel(3), '3 skrzynki')
  assert.equal(caseCountLabel(5), '5 skrzynek')
  assert.equal(caseCountLabel(13), '13 skrzynek')
  assert.equal(caseCountLabel(22), '22 skrzynki')
})
