import assert from 'node:assert/strict'
import test from 'node:test'

import {
  LABEL_PAGE_SIZE,
  labelListPage,
  readLabelListParams,
  refreshBatches,
  REFRESH_BATCH_SIZE,
  withLabelFilter,
  writeLabelListParams,
} from './labelListParams'

function read(search: string) {
  return readLabelListParams(new URLSearchParams(search))
}

test('an empty address bar is every label there is', () => {
  assert.deepEqual(read(''), {
    limit: LABEL_PAGE_SIZE,
    offset: 0,
    organizerId: null,
    search: null,
    template: null,
  })
})

test('filters and page are read from the query string', () => {
  const query = read('q=wiertarki&template=contents&organizerId=4&page=3')

  assert.equal(query.search, 'wiertarki')
  assert.equal(query.template, 'contents')
  assert.equal(query.organizerId, 4)
  assert.equal(query.offset, 2 * LABEL_PAGE_SIZE)
  assert.equal(labelListPage(query), 3)
})

test('a broken template or organizer in a pasted link still shows the labels', () => {
  // The API answers 400 for a template it does not know, and an error screen is
  // a poor answer to an old bookmark.
  assert.equal(read('template=naklejka').template, null)
  assert.equal(read('organizerId=0').organizerId, null)
  assert.equal(read('organizerId=cztery').organizerId, null)
})

test('what is read can be written back, and nothing empty is written', () => {
  const query = read('q=wiertarki&template=number&page=2')

  assert.equal(writeLabelListParams(query).toString(), 'q=wiertarki&template=number&page=2')
  assert.equal(writeLabelListParams(read('')).toString(), '')
})

test('changing a filter goes back to the first page', () => {
  // Staying on page 4 of a result set that now has one shows an empty screen
  // that reads as "nothing here" when the truth is "you are past the end".
  const query = withLabelFilter(read('page=4'), { template: 'number' })

  assert.equal(query.offset, 0)
  assert.equal(query.template, 'number')
})

test('a selection larger than the server takes is sent in batches', () => {
  // Somebody who ticked every label asked for all of them, not for the first
  // fifty — the cap is the server's, so the batching is this screen's.
  const ids = Array.from({ length: REFRESH_BATCH_SIZE + 3 }, (_, index) => index + 1)
  const batches = refreshBatches(ids)

  assert.equal(batches.length, 2)
  assert.equal(batches[0].length, REFRESH_BATCH_SIZE)
  assert.deepEqual(batches[1], [51, 52, 53])
  assert.deepEqual(batches.flat(), ids)
})

test('nothing selected is nothing to send', () => {
  assert.deepEqual(refreshBatches([]), [])
})
