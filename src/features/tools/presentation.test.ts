import assert from 'node:assert/strict'
import test from 'node:test'

import { TOOL_CONDITIONS } from '../../api/types'
import {
  CONDITION_COLORS,
  CONDITION_LABELS,
  conditionOptions,
  formatDateTime,
  toolCountLabel,
  toolSubtitle,
} from './presentation'

test('every condition the API can send has a label and a colour', () => {
  for (const condition of TOOL_CONDITIONS) {
    assert.ok(CONDITION_LABELS[condition], condition)
    assert.ok(CONDITION_COLORS[condition], condition)
  }

  assert.equal(conditionOptions().length, TOOL_CONDITIONS.length)
})

test('the subtitle drops the fields that were left empty', () => {
  assert.equal(
    toolSubtitle({ brand: 'Makita', model: 'HR2470', serialNumber: '12345-AB' }),
    'Makita · HR2470 · nr 12345-AB',
  )
  assert.equal(toolSubtitle({ brand: 'Makita', model: '', serialNumber: '' }), 'Makita')
  // Nothing filled in reads as nothing, not as a row of separators.
  assert.equal(toolSubtitle({ brand: '', model: '', serialNumber: '' }), '')
})

test('the count is written in the right Polish form', () => {
  assert.equal(toolCountLabel(1), '1 narzędzie')
  assert.equal(toolCountLabel(2), '2 narzędzia')
  assert.equal(toolCountLabel(4), '4 narzędzia')
  assert.equal(toolCountLabel(5), '5 narzędzi')
  assert.equal(toolCountLabel(0), '0 narzędzi')
  // The teens are the exception: 12 is "narzędzi", 22 is "narzędzia".
  assert.equal(toolCountLabel(12), '12 narzędzi')
  assert.equal(toolCountLabel(13), '13 narzędzi')
  assert.equal(toolCountLabel(22), '22 narzędzia')
  assert.equal(toolCountLabel(112), '112 narzędzi')
  assert.equal(toolCountLabel(122), '122 narzędzia')
})

test('an unusable timestamp shows a dash instead of "Invalid Date"', () => {
  assert.equal(formatDateTime('nie-data'), '—')
  assert.match(formatDateTime('2026-01-02T10:30:00.000Z'), /2026/)
})
