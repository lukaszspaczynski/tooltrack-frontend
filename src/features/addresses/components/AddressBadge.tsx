import { Badge, Tooltip } from '@mantine/core'

import type { Address } from '../../../api/types'
import { addressLine } from '../presentation'
import { AddressDot } from './AddressDot'

// Where a thing is, on a card in a grid.
//
// The name only, with the colour beside it. A grid is scanned rather than read,
// and a badge carrying "Puławska 12A/3, 02-566 Warszawa" is a badge that pushes
// everything else off the row — the street belongs on the detail page, and on
// the tooltip for whoever wants it here.
//
// Nothing at all for a thing nobody has located. An empty badge on most of a
// grid would be noise standing in for information, and "no address" is already
// visible as the absence of one.
export function AddressBadge({ address }: { address: null | Address }) {
  if (!address) return null

  const line = addressLine(address)

  return (
    <Tooltip label={line ? `${address.name} — ${line}` : address.name} disabled={!line}>
      <Badge
        variant="default"
        size="sm"
        leftSection={<AddressDot color={address.color} size={9} />}
        style={{ flexShrink: 0, maxWidth: '100%' }}
      >
        {address.name}
      </Badge>
    </Tooltip>
  )
}
