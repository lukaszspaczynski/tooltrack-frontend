import { Anchor, Button, Group, Stack, Text } from '@mantine/core'
import { IconMapPin } from '@tabler/icons-react'
import { useState } from 'react'
import { Link } from 'react-router-dom'

import { t } from '../../../i18n'
import { addressLine } from '../presentation'
import { useAddresses } from '../useAddresses'
import { AddressDot } from './AddressDot'
import { AddressSelect } from './AddressSelect'

// Where a thing is, on the reading side of a detail page.
//
// It reads the same short list the picker does, off the same cache key, rather
// than taking an expanded address from the card: an item answer carries
// `addressId` and nothing else, and widening it so that one line could be shown
// without a lookup would put a whole place on every row of every list.
//
// A link, because the reason to look at a place is usually to see what else is
// there.
//
// With `onChange`, the field can also be changed in place: a button beside the
// value swaps it for the picker, and choosing saves at once. Moving a thing
// is the one edit made standing next to it — the drill went to the other
// site — and opening the whole form to change one select, then finding Save
// under nine fields, is the reason it did not get written down.
export function AddressField({
  addressId,
  onChange,
  pending,
}: {
  addressId: null | number
  // Present when the person may move the thing. Called with the place chosen,
  // or null for "nowhere in particular", and only when that differs from now.
  onChange?: (addressId: null | number) => void
  pending?: boolean
}) {
  const { addressById } = useAddresses()
  const [choosing, setChoosing] = useState(false)
  const address = addressById(addressId)
  const line = address ? addressLine(address) : ''

  if (choosing && onChange) {
    return (
      <Group align="flex-end" gap="xs" wrap="nowrap">
        <AddressSelect
          value={addressId}
          onChange={(next) => {
            setChoosing(false)
            if (next !== addressId) onChange(next)
          }}
          openAtOnce
          style={{ flex: 1 }}
        />
        <Button variant="subtle" color="gray" onClick={() => setChoosing(false)}>
          {t('Anuluj')}
        </Button>
      </Group>
    )
  }

  return (
    <Stack gap={2}>
      <Text size="xs" c="dimmed" tt="uppercase" fw={600}>
        {t('Miejsce')}
      </Text>

      <Group gap="sm" wrap="nowrap" align="center" justify="space-between">
        {addressId === null ? (
          // A dash rather than nothing: on a detail page "nobody has said where
          // this is" is information, and a gap reads as a rendering fault.
          <Text size="sm" c="dimmed">
            —
          </Text>
        ) : (
          <Group gap={6} wrap="nowrap" align="center">
            <AddressDot color={address?.color ?? ''} />
            <Text size="sm">
              <Anchor component={Link} to="/addresses" inherit>
                {address?.name ?? t('Wczytywanie…')}
              </Anchor>
              {line ? (
                <Text span c="dimmed">
                  {' '}
                  — {line}
                </Text>
              ) : null}
            </Text>
          </Group>
        )}

        {onChange ? (
          <Button
            variant="light"
            color="gray"
            size="compact-sm"
            leftSection={<IconMapPin size={16} />}
            loading={pending}
            onClick={() => setChoosing(true)}
          >
            {t('Zmień')}
          </Button>
        ) : null}
      </Group>
    </Stack>
  )
}
