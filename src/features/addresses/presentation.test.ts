import assert from 'node:assert/strict'
import test from 'node:test'

import type { Address } from '../../api/types'
import { addressContents, addressLine, addressSummary } from './presentation'

function address(overrides: Partial<Address> = {}): Address {
  return {
    building: '12A',
    city: 'Warszawa',
    color: '#d0392a',
    createdAt: '2026-01-01T00:00:00.000Z',
    createdBy: 1,
    id: 1,
    name: 'Magazyn',
    notes: '',
    organizerCount: 0,
    postalCode: '02-566',
    street: 'Puławska',
    toolCount: 0,
    unit: '3',
    updatedAt: '2026-01-01T00:00:00.000Z',
    updatedBy: 1,
    ...overrides,
  }
}

test('an address reads the way it is written on an envelope', () => {
  assert.equal(addressLine(address()), 'Puławska 12A/3, 02-566 Warszawa')
})

test('a missing part leaves no stray comma behind', () => {
  // Every field but the name is optional, so most of these happen. A place
  // that reads ", Warszawa" looks like a bug in the screen.
  assert.equal(addressLine(address({ unit: '' })), 'Puławska 12A, 02-566 Warszawa')
  assert.equal(addressLine(address({ building: '', unit: '' })), 'Puławska, 02-566 Warszawa')
  assert.equal(addressLine(address({ postalCode: '' })), 'Puławska 12A/3, Warszawa')
  assert.equal(
    addressLine(address({ building: '', city: '', postalCode: '', street: '', unit: '' })),
    '',
  )
})

test('the summary leads with the name, because that is what is looked for', () => {
  // A crew says "magazyn". The street is what confirms they found the right one.
  assert.equal(addressSummary(address()), 'Magazyn — Puławska 12A/3, 02-566 Warszawa')
})

test('a place with nothing but a name is just its name', () => {
  // A yard on a site. No dash, no trailing punctuation.
  const bare = address({ building: '', city: '', postalCode: '', street: '', unit: '' })

  assert.equal(addressSummary(bare), 'Magazyn')
})

test('empty is both counts at zero, not either', () => {
  // It is what says a place can be tidied away, so an arrangement standing
  // there with no loose tools still counts as occupied.
  assert.equal(addressContents(address()).empty, true)
  assert.equal(addressContents(address({ toolCount: 3 })).empty, false)
  assert.equal(addressContents(address({ organizerCount: 1 })).empty, false)
})
