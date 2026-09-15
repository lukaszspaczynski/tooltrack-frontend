// How a case reads on screen. Pure functions, apart from the components, so
// the wording is in one place and can be tested without rendering anything.

import type { ToolCase } from '../../api/types'
import { CASE_ATTRIBUTE_LABELS } from './attributeLabels'

// What a box states, read off its spec sheet.
//
// These were typed fields until a box stopped being eleven columns. They are
// parameters now, which means the name is the key and the value carries its
// unit — "450 mm" — so a screen reads them rather than formats them.
export function attributeValue(item: Pick<ToolCase, 'attributes'>, name: string): string {
  return item.attributes.find((attribute) => attribute.name === name)?.value ?? ''
}

// "450 × 322 × 126 mm", or nothing at all.
//
// A partial set is shown as far as it goes rather than padded with question
// marks: two measurements out of three is still worth reading, and an invented
// third is not. The unit is written once at the end, which is why it is
// stripped from each value first.
function dimensions(item: Pick<ToolCase, 'attributes'>, names: string[]): string {
  const parts = names.map((name) => attributeValue(item, name).replace(' mm', '')).filter(Boolean)
  if (parts.length === 0) return ''

  return `${parts.join(' × ')} mm`
}

export function outerDimensions(item: Pick<ToolCase, 'attributes'>): string {
  return dimensions(item, [
    CASE_ATTRIBUTE_LABELS.outerLength,
    CASE_ATTRIBUTE_LABELS.outerWidth,
    CASE_ATTRIBUTE_LABELS.outerHeight,
  ])
}

export function innerDimensions(item: Pick<ToolCase, 'attributes'>): string {
  return dimensions(item, [
    CASE_ATTRIBUTE_LABELS.innerLength,
    CASE_ATTRIBUTE_LABELS.innerWidth,
    CASE_ATTRIBUTE_LABELS.innerHeight,
  ])
}

// What goes in and what it carries — the two facts somebody choosing a box is
// choosing between.
export function capacity(item: Pick<ToolCase, 'attributes'>): string {
  return attributeValue(item, CASE_ATTRIBUTE_LABELS.volume)
}

export function load(item: Pick<ToolCase, 'attributes'>): string {
  return attributeValue(item, CASE_ATTRIBUTE_LABELS.load)
}

// The maker and the system, as one line under the name. Either may be missing
// and the line closes up rather than showing a stray separator.
export function caseSubtitle(item: Pick<ToolCase, 'brand' | 'system'>): string {
  return [item.brand?.name, item.system]
    .map((part) => part?.trim())
    .filter(Boolean)
    .join(' · ')
}

// Polish counts a case three ways. The list header says how many there are.
export function caseCountLabel(count: number): string {
  const lastTwo = count % 100
  const last = count % 10

  if (count === 1) return '1 skrzynka'
  if (lastTwo >= 12 && lastTwo <= 14) return `${count} skrzynek`
  if (last >= 2 && last <= 4) return `${count} skrzynki`
  return `${count} skrzynek`
}
