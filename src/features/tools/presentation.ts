// How the domain reads on screen. Pure functions and lookup tables, apart from
// the components, so the wording is in one place and can be tested without
// rendering anything.

import type { Role, Tool, ToolCondition } from '../../api/types'
import { ROLES, TOOL_CONDITIONS } from '../../api/types'

export const CONDITION_LABELS: Record<ToolCondition, string> = {
  good: 'Dobry',
  needs_repair: 'Do naprawy',
  new: 'Nowe',
  retired: 'Wycofane',
  worn: 'Zużyte',
}

// Green through red, with grey for a tool that is out of service. The colour
// is the thing you read across a grid of cards, so it carries the same order
// as the list itself.
export const CONDITION_COLORS: Record<ToolCondition, string> = {
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
  return TOOL_CONDITIONS.map((condition) => ({
    label: CONDITION_LABELS[condition],
    value: condition,
  }))
}

export function roleOptions(): { label: string; value: string }[] {
  return ROLES.map((role) => ({ label: ROLE_LABELS[role], value: role }))
}

// The line under a tool's name. Blank fields are dropped rather than shown as
// empty separators — most hand tools have no model and no serial number, and a
// card reading "Makita · · " looks broken rather than incomplete.
export function toolSubtitle(tool: Pick<Tool, 'brand' | 'model' | 'serialNumber'>): string {
  const parts = [tool.brand, tool.model, tool.serialNumber && `nr ${tool.serialNumber}`]

  return parts.filter((part) => Boolean(part)).join(' · ')
}

export function formatDateTime(iso: string): string {
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return '—'

  return new Intl.DateTimeFormat('pl-PL', { dateStyle: 'medium', timeStyle: 'short' }).format(date)
}

// "3 narzędzia" is not "3 narzędzi". Polish picks a form by the last digits,
// and getting it wrong is the kind of small wrongness people notice on every
// screen.
export function toolCountLabel(count: number): string {
  const lastTwo = count % 100
  const last = count % 10

  if (count === 1) return '1 narzędzie'
  if (lastTwo >= 12 && lastTwo <= 14) return `${count} narzędzi`
  if (last >= 2 && last <= 4) return `${count} narzędzia`
  return `${count} narzędzi`
}
