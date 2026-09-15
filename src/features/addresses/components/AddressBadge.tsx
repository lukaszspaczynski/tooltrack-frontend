import { Group, Text, Tooltip } from '@mantine/core'

import type { Address } from '../../../api/types'
import { addressLine } from '../presentation'
import { AddressDot } from './AddressDot'

// Where a thing is, in the top-left corner of its card.
//
// A sticker over the picture rather than a line in the body, and the mirror of
// the organizer badge in the opposite corner — same pill, same background,
// same border, so the two corners read as one pair of facts about the card
// rather than as two unrelated ornaments. The two never collide, because they
// are at opposite ends of the same row.
//
// The name only. A grid is scanned rather than read, and "Puławska 12A/3,
// 02-566 Warszawa" is a badge that covers the photograph underneath it. The
// street is on the tooltip for whoever wants it here, and on the detail page
// for everybody else.
//
// Nothing at all for a thing nobody has located. An empty badge on most of a
// grid is noise standing in for information, and "no address" is already
// visible as the absence of one.
export function AddressBadge({ address }: { address: null | Address }) {
  if (!address) return null

  const line = addressLine(address)

  return (
    <Tooltip label={line ? `${address.name} — ${line}` : address.name} disabled={!line}>
      {/* Above the stretched link, or the card's own anchor swallows the hover
          and the tooltip never opens. */}
      <Group
        className="above-stretched-link"
        gap={5}
        wrap="nowrap"
        p={3}
        pr={8}
        maw="70%"
        style={{
          backgroundColor: 'var(--mantine-color-body)',
          border: '1px solid var(--mantine-color-default-border)',
          borderRadius: 999,
          left: 6,
          position: 'absolute',
          top: 6,
        }}
      >
        <AddressDot color={address.color} size={12} />
        <Text size="xs" fw={600} lh={1.3} lineClamp={1} c="var(--mantine-color-text)">
          {address.name}
        </Text>
      </Group>
    </Tooltip>
  )
}
