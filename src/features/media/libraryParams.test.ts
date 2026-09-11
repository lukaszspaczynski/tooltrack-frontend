import assert from 'node:assert/strict'
import test from 'node:test'

import {
  LIBRARY_PAGE_SIZE,
  libraryPage,
  readLibraryParams,
  withLibraryFilter,
  writeLibraryParams,
} from './libraryParams'

function read(search: string) {
  return readLibraryParams(new URLSearchParams(search))
}

test('an empty address bar is the whole library, newest first', () => {
  assert.deepEqual(read(''), {
    limit: LIBRARY_PAGE_SIZE,
    offset: 0,
    search: null,
    source: null,
  })
})

test('filters and page are read from the query string', () => {
  const query = read('q=makita&source=search&page=3')

  assert.equal(query.search, 'makita')
  assert.equal(query.source, 'search')
  assert.equal(query.offset, 2 * LIBRARY_PAGE_SIZE)
  assert.equal(libraryPage(query), 3)
})

test('a stale or invented source is dropped', () => {
  assert.equal(read('source=nieznane').source, null)
  assert.equal(read('source=').source, null)
  assert.equal(read('page=0').offset, 0)
})

test('what is written can be read back, and defaults write nothing', () => {
  assert.equal(writeLibraryParams(read('')).toString(), '')

  const original = read('q=bosch&source=url&page=2')
  assert.deepEqual(readLibraryParams(writeLibraryParams(original)), original)
})

test('changing a filter returns to the first page', () => {
  const filtered = withLibraryFilter(read('q=bosch&page=5'), { source: 'upload' })

  assert.equal(filtered.offset, 0)
  assert.equal(filtered.source, 'upload')
  assert.equal(filtered.search, 'bosch')
})
