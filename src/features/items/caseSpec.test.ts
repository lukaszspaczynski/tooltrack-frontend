import assert from 'node:assert/strict'
import test from 'node:test'

import type { ItemDetail } from '../../api/types'
import { attributeValue, capacity, innerDimensions, load, outerDimensions } from './caseSpec'

// A box states what it states, as parameters, with the unit in the value.
function sheet(...pairs: [string, string][]): Pick<ItemDetail, 'attributes'> {
  return {
    attributes: pairs.map(([name, value], index) => ({ id: index + 1, name, value })),
  }
}

test('three parameters read as one measurement', () => {
  // The page writes "450 [L] x 322 [W] x 126 [H] mm" and the catalog keeps
  // three rows, because a length and a width are two facts. A screen puts them
  // back together, with the unit written once.
  const box = sheet(
    ['Długość zewnętrzna', '450 mm'],
    ['Szerokość zewnętrzna', '322 mm'],
    ['Wysokość zewnętrzna', '126 mm'],
  )

  assert.equal(outerDimensions(box), '450 × 322 × 126 mm')
})

test('a partial set is shown as far as it goes', () => {
  // Two measurements out of three is still worth reading, and an invented
  // third is not.
  const box = sheet(['Długość wewnętrzna', '408 mm'], ['Szerokość wewnętrzna', '226 mm'])

  assert.equal(innerDimensions(box), '408 × 226 mm')
  assert.equal(outerDimensions(box), '')
})

test('what goes in and what it carries come off the sheet as written', () => {
  // The unit travels in the value, so nothing here formats a number — it reads
  // one. "11 L" is what the page said and what the card shows.
  const box = sheet(['Pojemność', '11 L'], ['Ładowność', '15 kg'])

  assert.equal(capacity(box), '11 L')
  assert.equal(load(box), '15 kg')
  // A box nobody has measured says nothing rather than "0".
  assert.equal(capacity(sheet()), '')
})

test('a parameter nobody wrote reads as empty, not as undefined', () => {
  assert.equal(attributeValue(sheet(['EAN', '5901238254232']), 'EAN'), '5901238254232')
  assert.equal(attributeValue(sheet(), 'SKU'), '')
})
