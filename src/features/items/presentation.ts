// How the domain reads on screen. Pure functions and lookup tables, apart from
// the components, so the wording is in one place and can be tested without
// rendering anything.

import type { Role, Item, ItemCondition, ItemKind } from '../../api/types'
import { ROLES, ITEM_CONDITIONS } from '../../api/types'
import { COUNTS, t, tCount, tDate } from '../../i18n'

export const CONDITION_LABELS: Record<ItemCondition, string> = {
  good: 'Dobry',
  needs_repair: 'Do naprawy',
  new: 'Nowe',
  retired: 'Wycofane',
  worn: 'Zużyte',
}

// What sort of thing a card is about. Read where a screen shows cards of more
// than one sort at once — the photo library, which lists every card a picture
// hangs on, is the one that needs it.
export const KIND_LABELS: Record<ItemKind, string> = {
  appliance: 'RTV/AGD',
  case: 'Skrzynka',
  tool: 'Narzędzie',
}

// Green through red, with grey for an item that is out of service. The colour
// is the thing you read across a grid of cards, so it carries the same order
// as the list itself.
export const CONDITION_COLORS: Record<ItemCondition, string> = {
  good: 'teal',
  needs_repair: 'orange',
  new: 'green',
  retired: 'gray',
  worn: 'yellow',
}

export const ROLE_LABELS: Record<Role, string> = {
  admin: 'Administrator',
  editor: 'Edytor',
  viewer: 'Podgląd',
}

export const ROLE_DESCRIPTIONS: Record<Role, string> = {
  admin: 'Wszystko co edytor, plus zarządzanie użytkownikami i rolami.',
  editor: 'Przegląda katalog oraz dodaje, edytuje i usuwa narzędzia.',
  viewer: 'Tylko przegląda katalog.',
}

export function conditionOptions(): { label: string; value: string }[] {
  return ITEM_CONDITIONS.map((condition) => ({
    label: t(CONDITION_LABELS[condition]),
    value: condition,
  }))
}

export function roleOptions(): { label: string; value: string }[] {
  return ROLES.map((role) => ({ label: t(ROLE_LABELS[role]), value: role }))
}

// The line under an item's name. Blank fields are dropped rather than shown as
// empty separators — most hand items have no model and no serial number, and a
// card reading "Makita · · " looks broken rather than incomplete.
export function itemSubtitle(item: Pick<Item, 'brand' | 'model' | 'serialNumber'>): string {
  const parts = [item.brand?.name, item.model, item.serialNumber && `nr ${item.serialNumber}`]

  return parts.filter((part) => Boolean(part)).join(' · ')
}

// The date reads in the language the screen is in; the dash for an unusable
// timestamp is the same in both.
export function formatDateTime(iso: string): string {
  return tDate(iso)
}

// "3 narzędzia" is not "3 narzędzi", and neither is "3 items": the forms
// live in the catalog and the rules in i18n/lang.ts.
export function itemCountLabel(count: number): string {
  return tCount(COUNTS.item, count)
}
