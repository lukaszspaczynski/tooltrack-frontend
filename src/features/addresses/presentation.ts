import type { Address } from '../../api/types'

// One line for a picker and a card: the name, and enough of the street to tell
// two sites in one city apart. The name is first because it is what somebody
// is looking for — "magazyn" — and the rest is what confirms they found it.
export function addressSummary(address: Address): string {
  const where = addressLine(address)
  return where ? `${address.name} — ${where}` : address.name
}

// The postal half on one line, in the order it is written on an envelope here:
// street and number, then postcode and city. Every part is optional, and a
// missing one must not leave a stray comma or a double space behind.
export function addressLine(address: Address): string {
  const building = [address.building, address.unit].filter(Boolean).join('/')
  const street = [address.street, building].filter(Boolean).join(' ')
  const city = [address.postalCode, address.city].filter(Boolean).join(' ')

  return [street, city].filter(Boolean).join(', ')
}

// What is kept here, as a sentence rather than two numbers nobody adds up. The
// empty case is the useful one: it is what says a place can be tidied away.
export function addressContents(address: Address): {
  empty: boolean
  organizers: number
  tools: number
} {
  return {
    empty: address.toolCount === 0 && address.organizerCount === 0,
    organizers: address.organizerCount,
    tools: address.toolCount,
  }
}
