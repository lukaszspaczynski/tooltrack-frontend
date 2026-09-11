// How a case reads on screen. Pure functions, apart from the components, so
// the wording is in one place and can be tested without rendering anything.

import type { ToolCase } from '../../api/types'

type Dimensions = {
  height: null | number
  length: null | number
  width: null | number
}

// "450 × 331 × 240 mm", or nothing at all. A partial set is shown as far as it
// goes rather than padded with question marks: two measurements out of three
// is still worth reading, and an invented third is not.
export function formatDimensions(dimensions: Dimensions): string {
  const parts = [dimensions.length, dimensions.width, dimensions.height].filter(
    (part): part is number => part !== null,
  )
  if (parts.length === 0) return ''

  return `${parts.join(' × ')} mm`
}

export function outerDimensions(item: ToolCase): string {
  return formatDimensions({
    height: item.outerHeightMm,
    length: item.outerLengthMm,
    width: item.outerWidthMm,
  })
}

export function innerDimensions(item: ToolCase): string {
  return formatDimensions({
    height: item.innerHeightMm,
    length: item.innerLengthMm,
    width: item.innerWidthMm,
  })
}

// A Polish decimal comma, and no trailing zeroes: the label says "4,5 L", not
// "4.50 L".
export function formatNumber(value: null | number, unit: string): string {
  if (value === null) return ''

  return `${new Intl.NumberFormat('pl-PL', { maximumFractionDigits: 2 }).format(value)} ${unit}`
}

// The line under a case's name. Blank fields are dropped rather than shown as
// empty separators.
export function caseSubtitle(item: Pick<ToolCase, 'manufacturer' | 'system'>): string {
  return [item.manufacturer, item.system].filter(Boolean).join(' · ')
}

// "3 skrzynki" is not "3 skrzynek". Polish picks a form by the last digits,
// and getting it wrong is the kind of small wrongness people notice on every
// screen.
export function caseCountLabel(count: number): string {
  const lastTwo = count % 100
  const last = count % 10

  if (count === 1) return '1 skrzynka'
  if (lastTwo >= 12 && lastTwo <= 14) return `${count} skrzynek`
  if (last >= 2 && last <= 4) return `${count} skrzynki`
  return `${count} skrzynek`
}
