import assert from 'node:assert/strict'
import test from 'node:test'

import { readCaseParams, withFilter, writeCaseParams } from './listParams'

test('an empty address is the default shelf', () => {
  const query = readCaseParams(new URLSearchParams())

  // Alphabetical, because a shelf is something people point at rather than
  // scroll through by date.
  assert.equal(query.sort, 'name')
  assert.equal(query.offset, 0)
  assert.equal(query.search, null)
})

test('only what differs from the default reaches the address bar', () => {
  const query = readCaseParams(new URLSearchParams())

  assert.equal(writeCaseParams(query).toString(), '')
  assert.equal(writeCaseParams({ ...query, search: 'toolbox' }).toString(), 'q=toolbox')
  assert.equal(writeCaseParams({ ...query, sort: 'capacityL' }).toString(), 'sort=capacityL')
})

test('the address survives a round trip', () => {
  const params = new URLSearchParams('q=pro&manufacturer=Qbrick&sort=capacityL&page=3')

  assert.equal(writeCaseParams(readCaseParams(params)).toString(), params.toString())
})

test('an unknown sort in a pasted link falls back rather than failing', () => {
  assert.equal(readCaseParams(new URLSearchParams('sort=cokolwiek')).sort, 'name')
})

test('page 3 is an offset, and page 1 is no parameter at all', () => {
  assert.equal(readCaseParams(new URLSearchParams('page=3')).offset, 48)
  assert.equal(writeCaseParams(readCaseParams(new URLSearchParams('page=1'))).toString(), '')
})

test('changing a filter returns to the first page', () => {
  // Or the screen shows nothing and looks like "no matches" when the truth is
  // "you are past the end".
  const query = readCaseParams(new URLSearchParams('page=4'))

  assert.equal(withFilter(query, { search: 'drawer' }).offset, 0)
})
