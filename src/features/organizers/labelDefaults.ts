// What a label says when nobody has said otherwise.
//
// The wizard starts from these and the "fill the gaps" button sends them
// unchanged, which is the only reason both can be described as the defaults: a
// second copy of the rules would make one of the two screens quietly print
// something else.

import type { LabelRequest } from '../../api/organizers'
import type { OrganizerLabelSlot, OrganizerItem } from '../../api/types'

export type LabelPhoto = { id: number; name: string; url: string }

// Every template there is. A place on the box can carry either, and both are
// worth having: the number is read across a workshop, the contents is read
// with the box in your hands.
export const LABEL_TEMPLATES = ['contents', 'number'] as const

export type LabelTemplate = (typeof LABEL_TEMPLATES)[number]

export type MissingLabel = { slot: OrganizerLabelSlot; template: LabelTemplate }

// How many pictures a card holds depends on its shape: six across a 200 x 60
// lid are still bigger than three down a 30 x 40 front. The same rule as the
// server, which refuses a seventh rather than dropping it quietly.
export function maxPhotosFor(slot: null | OrganizerLabelSlot): number {
  return slot && slot.widthMm / slot.heightMm >= 2 ? 6 : 3
}

// The pictures the contents template may show, each offered once.
//
// Two identical batteries are two items sharing one photograph, so the same
// picture would otherwise appear twice — and ticking both would spend two of
// the three places on one image.
//
// The first item to carry it gives it a name, which is why this is a loop and
// not a Map built from pairs: building it from pairs keeps the first position
// but the last value, so the caption came from whichever duplicate happened to
// be last in the catalog's order.
export function labelPhotos(items: OrganizerItem[]): LabelPhoto[] {
  const byId = new Map<number, LabelPhoto>()

  for (const item of items) {
    if (item.primaryPhotoUrl === null) continue

    const id = photoIdFromUrl(item.primaryPhotoUrl)
    if (!byId.has(id)) byId.set(id, { id, name: item.name, url: item.primaryPhotoUrl })
  }

  return [...byId.values()]
}

// What is written on the machine, and what a spare part is ordered by. Shown
// in the wizard's own option, because "POF 1200 F5" means nothing until you
// see it.
export function toolModels(items: OrganizerItem[]): string {
  return [...new Set(items.map((item) => item.model.trim()).filter(Boolean))].join(', ')
}

// The models where there are any: they fit a 30 mm band, which a list of
// catalog names does not. An organizer whose items carry no model has nothing
// to print from them, and the wizard does not even offer the option.
export function defaultCaptionSource(items: OrganizerItem[]): 'models' | 'items' {
  return toolModels(items) ? 'models' : 'items'
}

// Every label a case could carry that it does not carry yet: each place on the
// box crossed with each template. A place is not "done" once it has a sticker —
// the two templates say different things, and a box wants both.
//
// Matched on the size rather than on the slot id, because that is what a label
// carries: a case cannot have two places of the same size, and a label keeps
// its own size even after the place it was made for is taken off the case.
export function missingLabels(
  slots: OrganizerLabelSlot[],
  labels: { heightMm: number; template: string; widthMm: number }[],
): MissingLabel[] {
  return slots.flatMap((slot) =>
    LABEL_TEMPLATES.filter(
      (template) =>
        !labels.some(
          (label) =>
            label.widthMm === slot.widthMm &&
            label.heightMm === slot.heightMm &&
            label.template === template,
        ),
    ).map((template) => ({ slot, template })),
  )
}

// A whole label, with nothing chosen by hand. Both of the contents lines are
// left empty, which is how the server is told to work them out from the catalog
// itself, and the number template gets the logos it offers.
export function defaultLabelRequest(
  items: OrganizerItem[],
  slot: OrganizerLabelSlot,
  template: LabelTemplate,
): LabelRequest {
  if (template === 'number') {
    return { printReady: true, slotId: slot.id, template, withLogos: true }
  }

  return {
    namesSource: defaultCaptionSource(items),
    namesText: '',
    photoIds: labelPhotos(items)
      .slice(0, maxPhotosFor(slot))
      .map((photo) => photo.id),
    printReady: true,
    slotId: slot.id,
    template,
    titleText: '',
    withNames: true,
    withTitle: true,
  }
}

// A photo URL is /api/photos/<id>/file. The id is what a label is drawn from;
// the path is the server's to change, so this is the one place that reads it.
function photoIdFromUrl(url: string): number {
  return Number(url.split('/')[3])
}
