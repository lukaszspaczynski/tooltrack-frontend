import assert from 'node:assert/strict'
import test from 'node:test'

import {
  MANUAL_PAGE_SIZE,
  manualListPage,
  readManualListParams,
  withManualFilter,
  writeManualListParams,
} from './manualListParams'

function read(search: string) {
  return readManualListParams(new URLSearchParams(search))
}

test('an empty query is the first page of everything', () => {
  assert.deepEqual(read(''), { limit: MANUAL_PAGE_SIZE, offset: 0, search: null })
})

test('pages and offsets convert both ways', () => {
  assert.equal(read('page=3').offset, MANUAL_PAGE_SIZE * 2)
  assert.equal(manualListPage(read('page=3')), 3)
  // A page number nobody could be on is the first page rather than an error.
  assert.equal(read('page=0').offset, 0)
  assert.equal(read('page=banan').offset, 0)
})

test('what is written can be read back', () => {
  const query = read('q=pilarka&page=2')

  assert.deepEqual(readManualListParams(writeManualListParams(query)), query)
  // Nothing to say is nothing in the address bar.
  assert.equal(writeManualListParams(read('')).toString(), '')
})

test('a blank search is no search', () => {
  assert.equal(read('q=%20%20').search, null)
})

test('changing the filter returns to the first page', () => {
  const narrowed = withManualFilter(read('page=4'), { search: 'pilarka' })

  assert.equal(narrowed.offset, 0)
  assert.equal(narrowed.search, 'pilarka')
})
