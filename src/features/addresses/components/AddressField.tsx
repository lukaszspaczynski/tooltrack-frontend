import { Anchor, Group, Stack, Text } from '@mantine/core'
import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'

import { fetchAddresses } from '../../../api/addresses'
import { t } from '../../../i18n'
import { addressLine } from '../presentation'
import { AddressDot } from './AddressDot'

// Where a thing is, on the reading side of a detail page.
//
// It reads the same short list the picker does, off the same cache key, rather
// than taking an expanded address from the card: a tool answer carries
// `addressId` and nothing else, and widening it so that one line could be shown
// without a lookup would put a whole place on every row of every list.
//
// A link, because the reason to look at a place is usually to see what else is
// there.
export function AddressField({ addressId }: { addressId: null | number }) {
  const query = useQuery({
    enabled: addressId !== null,
    queryFn: () => fetchAddresses({ limit: 500, offset: 0, search: null, sort: 'name' }),
    queryKey: ['addresses', { limit: 500, search: null, sort: 'name' }],
  })

  const address = query.data?.items.find((item) => item.id === addressId) ?? null
  const line = address ? addressLine(address) : ''

  return (
    <Stack gap={2}>
      <Text size="xs" c="dimmed" tt="uppercase" fw={600}>
        {t('Miejsce')}
      </Text>

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
    </Stack>
  )
}
