import assert from 'node:assert/strict'
import test from 'node:test'

import {
  allShownCount,
  keepVisibleSelection,
  LABEL_ALL_LIMIT,
  LABEL_PAGE_SIZE,
  labelListPage,
  labelsBeyondAll,
  readLabelListParams,
  refreshBatches,
  REFRESH_BATCH_SIZE,
  showingAll,
  withAllShown,
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

test('everything on one page is a state of the address bar like any other', () => {
  // It has to survive a refresh and be sendable as a link, same as the filters.
  const query = read('all=1&template=number')

  assert.equal(showingAll(query), true)
  assert.equal(query.limit, LABEL_ALL_LIMIT)
  assert.equal(writeLabelListParams(query).toString(), 'template=number&all=1')
})

test('a page number left over from the paged view is ignored while showing everything', () => {
  // Page 4 is nowhere in particular once the list stops being paged, and an
  // offset would hide the first three pages' worth of labels.
  assert.equal(read('all=1&page=4').offset, 0)
})

test('switching either way starts from the top', () => {
  assert.equal(withAllShown(read('page=3'), true).limit, LABEL_ALL_LIMIT)
  assert.equal(withAllShown(read('page=3'), true).offset, 0)

  const paged = withAllShown(read('all=1'), false)
  assert.equal(paged.limit, LABEL_PAGE_SIZE)
  assert.equal(paged.offset, 0)
  assert.equal(showingAll(paged), false)
})

test('a filter change keeps the view it was made in', () => {
  // Turning off paging to gather a print sheet and then narrowing the search
  // must not drop the person back into pages of twenty-four.
  const narrowed = withLabelFilter(read('all=1'), { template: 'number' })

  assert.equal(showingAll(narrowed), true)
  assert.equal(narrowed.offset, 0)
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

test('the button promises what it can show, not what exists', () => {
  // The server refuses more than its ceiling, so "Wszystkie (300)" followed by
  // two hundred tiles would be the screen lying about what it is about to do.
  assert.equal(allShownCount(12), 12)
  assert.equal(allShownCount(LABEL_ALL_LIMIT), LABEL_ALL_LIMIT)
  assert.equal(allShownCount(LABEL_ALL_LIMIT + 51), LABEL_ALL_LIMIT)

  assert.equal(labelsBeyondAll(12), 0)
  assert.equal(labelsBeyondAll(LABEL_ALL_LIMIT + 51), 51)
})

test('ticks survive the view widening and die with the rows', () => {
  // Pressing "Wszystkie" to finish gathering a sheet must not throw away what
  // was already ticked: those labels are still on the screen. Turning the page
  // is the other case, and there the ticks have to go.
  const selected = [4, 7, 9]

  assert.deepEqual(keepVisibleSelection(selected, [1, 4, 7, 9, 12]), selected)
  assert.deepEqual(keepVisibleSelection(selected, [7, 12]), [7])
  assert.deepEqual(keepVisibleSelection(selected, []), [])
})

test('a page that did not change leaves the selection alone', () => {
  // Re-reading the same rows after a redraw must not count as a change: a new
  // array here would restart every effect watching the selection.
  const selected = [4, 7]

  assert.equal(keepVisibleSelection(selected, [4, 7]), selected)
})
