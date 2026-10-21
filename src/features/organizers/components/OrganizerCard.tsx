import { Badge, Card, Group, Image, SimpleGrid, Stack, Text, Tooltip } from '@mantine/core'
import { IconPhotoOff } from '@tabler/icons-react'
import { Link } from 'react-router-dom'

import { apiFileUrl } from '../../../api/client'
import type { Organizer } from '../../../api/types'
import { COUNTS, t, tCount } from '../../../i18n'
import { AddressBadge } from '../../addresses/components/AddressBadge'
import { useAddresses } from '../../addresses/useAddresses'

// One arrangement, as it appears in the list. The whole card opens it, the
// same as an item or a case card — everything that changes anything lives on
// the page behind it, so nothing here can be pressed by accident while
// scrolling with a gloved thumb.
export function OrganizerCard({ item }: { item: Organizer }) {
  const { addressById } = useAddresses()

  return (
    <Card
      component={Link}
      to={`/organizers/${item.id}`}
      withBorder
      padding="md"
      radius="md"
      style={{ textDecoration: 'none' }}
    >
      {/* Four across, wrapping downwards for as many rows as it takes. Not a
          scrolling strip: this is read on a phone by somebody in gloves, and a
          card that hides half its contents sideways hides them for good. */}
      <Card.Section p="xs" bg="var(--mantine-color-default-hover)" pos="relative">
        {/* Where the box stands, in the corner, the same sticker an item card
            carries — so one mark means one thing across both grids. */}
        <AddressBadge address={addressById(item.addressId)} />
        <SimpleGrid cols={4} spacing={6} verticalSpacing={6}>
          <Thumbnail
            alt={item.case.name}
            isCase
            label={t('{name} (skrzynka)', { name: item.case.name })}
            url={item.case.primaryPhotoUrl}
          />
          {item.items.map((item) => (
            <Thumbnail key={item.id} alt={item.name} label={item.name} url={item.primaryPhotoUrl} />
          ))}
        </SimpleGrid>
      </Card.Section>

      <Stack gap="xs" pt="sm">
        <Group gap="xs" wrap="nowrap" align="flex-start">
          <Badge variant="filled" color="amber" size="lg" style={{ flexShrink: 0 }}>
            {item.number}
          </Badge>
          <Text fw={600} lineClamp={2} c="var(--mantine-color-text)">
            {item.name}
          </Text>
        </Group>

        <Text size="sm" c="dimmed" lineClamp={1} title={item.case.name}>
          {item.case.name}
        </Text>

        {item.description ? (
          <Text size="sm" c="dimmed" lineClamp={2}>
            {item.description}
          </Text>
        ) : null}

        <Text size="xs" c="dimmed">
          {itemCountLabel(item.items.length)}
        </Text>
      </Stack>
    </Card>
  )
}

// One cell of the grid. The height is fixed and the width fills its column, so
// every row lines up whatever shape the pictures are.
//
// The case cell is outlined: in a grid that wraps, "the first one" stops being
// obvious as soon as there is a second row.
function Thumbnail({
  alt,
  isCase = false,
  label,
  url,
}: {
  alt: string
  isCase?: boolean
  label: string
  url: null | string
}) {
  const border = isCase ? '2px solid var(--mantine-color-amber-6)' : '1px solid transparent'

  const tile = url ? (
    <Image src={apiFileUrl(url)} alt={alt} h={64} fit="contain" radius="sm" />
  ) : (
    <Group h={64} justify="center" bg="var(--mantine-color-default)" style={{ borderRadius: 4 }}>
      <IconPhotoOff size={18} color="var(--mantine-color-dimmed)" />
    </Group>
  )

  return (
    <Tooltip label={label}>
      <div style={{ border, borderRadius: 6, lineHeight: 0, padding: 1 }}>{tile}</div>
    </Tooltip>
  )
}

// An arrangement with nothing in it is empty rather than "0 narzędzi".
function itemCountLabel(count: number): string {
  return count === 0 ? t('pusty') : tCount(COUNTS.item, count)
}
