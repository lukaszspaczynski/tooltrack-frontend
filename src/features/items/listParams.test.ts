import assert from 'node:assert/strict'
import test from 'node:test'

import type { ItemQuery } from '../../api/items'
import {
  offsetFromPage,
  PAGE_SIZE,
  pageFromOffset,
  readItemParams,
  withFilter,
  writeItemParams,
} from './listParams'

function read(search: string) {
  return readItemParams(new URLSearchParams(search))
}

test('an empty address bar is the default view', () => {
  assert.deepEqual(read(''), {
    category: null,
    condition: null,
    kind: null,
    direction: 'desc',
    limit: PAGE_SIZE,
    offset: 0,
    search: null,
    sort: 'updatedAt',
  })
})

test('filters are read from the query string', () => {
  const query = read('q=makita&category=Wiertarki&condition=needs_repair&page=3')

  assert.equal(query.search, 'makita')
  assert.equal(query.category, 'Wiertarki')
  assert.equal(query.condition, 'needs_repair')
  assert.equal(query.offset, 2 * PAGE_SIZE)
})

test('sorting by name reads A to Z, timestamps read newest first', () => {
  assert.equal(read('sort=name').direction, 'asc')
  assert.equal(read('sort=createdAt').direction, 'desc')
})

test('a stale or invented parameter is dropped, not passed on', () => {
  // The API answers 400 for an unknown condition; a pasted link should still
  // show the catalog.
  assert.equal(read('condition=broken').condition, null)
  assert.equal(read('sort=serialNumber').sort, 'updatedAt')
  assert.equal(read('page=0').offset, 0)
  assert.equal(read('page=nie').offset, 0)
})

test('blank filters read as no filter', () => {
  const query = read('q=%20&category=&condition=')

  assert.equal(query.search, null)
  assert.equal(query.category, null)
  assert.equal(query.condition, null)
})

test('the default view writes an empty query string', () => {
  assert.equal(writeItemParams(read('')).toString(), '')
})

test('what is written can be read back', () => {
  const original = read('q=makita&category=Wiertarki&condition=worn&sort=name&page=2')
  const roundTripped = readItemParams(writeItemParams(original))

  assert.deepEqual(roundTripped, original)
})

test('changing a filter returns to the first page', () => {
  const query = read('q=makita&page=4')

  const filtered = withFilter(query, { condition: 'retired' })

  assert.equal(filtered.offset, 0)
  assert.equal(filtered.condition, 'retired')
  assert.equal(filtered.search, 'makita')
})

test('pages and offsets convert both ways', () => {
  assert.equal(pageFromOffset(0), 1)
  assert.equal(pageFromOffset(PAGE_SIZE), 2)
  assert.equal(pageFromOffset(-10), 1)
  assert.equal(offsetFromPage(1), 0)
  assert.equal(offsetFromPage(3), 2 * PAGE_SIZE)
  assert.equal(offsetFromPage(0), 0)
})

test('the kind travels in the address bar, and nonsense in it does not', () => {
  // Same rule as the condition: a link somebody shared should still show the
  // catalog rather than an error about a parameter nobody typed on purpose.
  assert.equal(readItemParams(new URLSearchParams('kind=appliance')).kind, 'appliance')
  assert.equal(readItemParams(new URLSearchParams('kind=furniture')).kind, null)
  assert.equal(readItemParams(new URLSearchParams('')).kind, null)

  // And only what differs from the default is written back, so the plain
  // catalog stays at a clean address.
  assert.equal(writeItemParams(query({ kind: 'tool' })).get('kind'), 'tool')
  assert.equal(writeItemParams(query({ kind: null })).has('kind'), false)
})

function query(overrides: Partial<ItemQuery>): ItemQuery {
  return { ...readItemParams(new URLSearchParams('')), ...overrides }
}
