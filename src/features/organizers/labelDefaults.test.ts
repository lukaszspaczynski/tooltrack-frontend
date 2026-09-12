import assert from 'node:assert/strict'
import test from 'node:test'

import type { OrganizerTool } from '../../api/types'
import {
  defaultCaptionSource,
  defaultLabelRequest,
  labelPhotos,
  maxPhotosFor,
  missingLabels,
  toolModels,
} from './labelDefaults'

function tool(id: number, fields: Partial<OrganizerTool> = {}): OrganizerTool {
  return {
    brand: 'Bosch',
    id,
    model: `GBH ${id}`,
    name: `Narzędzie ${id}`,
    primaryPhotoUrl: `/api/photos/${id}/file`,
    ...fields,
  }
}

const front = { heightMm: 40, id: 1, widthMm: 30 }
const lid = { heightMm: 60, id: 2, widthMm: 200 }

test('how many pictures fit is a fact about the shape', () => {
  // Six across a 200 x 60 lid are still bigger than three down a 30 x 40 front.
  assert.equal(maxPhotosFor(front), 3)
  assert.equal(maxPhotosFor(lid), 6)
  // Exactly twice as wide counts as a lid, as it does on the server.
  assert.equal(maxPhotosFor({ heightMm: 30, id: 3, widthMm: 60 }), 6)
  assert.equal(maxPhotosFor(null), 3)
})

test('a picture two tools share is offered once', () => {
  // Two identical batteries are two tools and one photograph. Offering it twice
  // would let somebody spend two of three places on the same image.
  const photos = labelPhotos([tool(7), tool(8, { primaryPhotoUrl: '/api/photos/7/file' }), tool(9)])

  assert.deepEqual(
    photos.map((photo) => photo.id),
    [7, 9],
  )
  // The first tool to carry it gives it a name.
  assert.equal(photos[0].name, 'Narzędzie 7')
})

test('a tool with no picture contributes nothing', () => {
  assert.deepEqual(labelPhotos([tool(1, { primaryPhotoUrl: null })]), [])
})

test('the models are listed once each, in the order the tools come', () => {
  const models = toolModels([tool(1, { model: 'POF 1200' }), tool(2, { model: 'POF 1200' })])

  assert.equal(models, 'POF 1200')
  assert.equal(toolModels([tool(1, { model: '  ' })]), '')
})

test('the caption falls back to the names when no tool has a model', () => {
  // The models fit a 30 mm band where catalog names do not, but an organizer
  // whose tools carry none has nothing to print from them.
  assert.equal(defaultCaptionSource([tool(1)]), 'models')
  assert.equal(defaultCaptionSource([tool(1, { model: '' })]), 'tools')
  assert.equal(defaultCaptionSource([]), 'tools')
})

test('a default contents label fills the place it is made for', () => {
  const tools = [tool(1), tool(2), tool(3), tool(4)]

  assert.deepEqual(defaultLabelRequest(tools, front, 'contents'), {
    namesSource: 'models',
    namesText: '',
    // As many as the shape holds, and no more: the server refuses a fourth on
    // a front rather than dropping it quietly.
    photoIds: [1, 2, 3],
    printReady: true,
    slotId: front.id,
    template: 'contents',
    // Both lines empty, which is how the server is told to work them out from
    // the catalog rather than from something typed here.
    titleText: '',
    withNames: true,
    withTitle: true,
  })

  assert.deepEqual(defaultLabelRequest(tools, lid, 'contents').photoIds, [1, 2, 3, 4])
})

test('a default number label asks for the logos and nothing else', () => {
  // Nothing on it comes from the tools, so it is the same request whatever the
  // organizer holds.
  assert.deepEqual(defaultLabelRequest([], front, 'number'), {
    printReady: true,
    slotId: front.id,
    template: 'number',
    withLogos: true,
  })
})

test('missing is every place crossed with every template', () => {
  // A place is not done once it has a sticker: the number is read across a
  // workshop and the contents with the box in your hands.
  const nothingDrawn = missingLabels([front, lid], [])

  assert.deepEqual(
    nothingDrawn.map((gap) => [gap.slot.id, gap.template]),
    [
      [front.id, 'contents'],
      [front.id, 'number'],
      [lid.id, 'contents'],
      [lid.id, 'number'],
    ],
  )
})

test('a label counts against the place of its own size and its own template', () => {
  const gaps = missingLabels(
    [front, lid],
    [
      { heightMm: 40, template: 'number', widthMm: 30 },
      { heightMm: 60, template: 'contents', widthMm: 200 },
    ],
  )

  assert.deepEqual(
    gaps.map((gap) => [gap.slot.id, gap.template]),
    [
      [front.id, 'contents'],
      [lid.id, 'number'],
    ],
  )
})

test('a label of a size the case no longer has a place for fills no gap', () => {
  // It keeps its own size, and the place it was made for is gone. The case's
  // places are what has to be covered.
  const gaps = missingLabels([front], [{ heightMm: 60, template: 'contents', widthMm: 200 }])

  assert.equal(gaps.length, 2)
})

test('an organizer with nothing in it still makes a label', () => {
  // A box can be labelled before it is filled. The template copes with no
  // pictures; refusing here would be a rule the server does not have.
  assert.deepEqual(defaultLabelRequest([], front, 'contents').photoIds, [])
  assert.equal(defaultLabelRequest([], front, 'contents').namesSource, 'tools')
})
