import { Badge, Card, Group, Image, Stack, Text } from '@mantine/core'
import { IconPhotoOff } from '@tabler/icons-react'
import { Link } from 'react-router-dom'

import { apiFileUrl } from '../../../api/client'
import type { CaseListItem } from '../../../api/types'
import { caseSubtitle, formatNumber, outerDimensions } from '../presentation'

// One case, as it appears in the grid. The same card shape as a tool, because
// it is read in the same place under the same conditions: on a phone, in a
// van, by somebody looking for the box rather than the drill.
export function CaseCard({ item }: { item: CaseListItem }) {
  const subtitle = caseSubtitle(item)
  const dimensions = outerDimensions(item)
  const capacity = formatNumber(item.capacityL, 'L')

  return (
    <Card
      component={Link}
      to={`/cases/${item.id}`}
      withBorder
      padding="md"
      radius="md"
      style={{ textDecoration: 'none' }}
    >
      <Card.Section>
        {/* Fixed height whether or not there is a photo: a grid where every
            other card is shorter is a grid nobody can scan. */}
        {item.primaryPhotoUrl ? (
          <Image
            src={apiFileUrl(item.primaryPhotoUrl)}
            alt={item.name}
            h={140}
            fit="contain"
            bg="var(--mantine-color-default-hover)"
          />
        ) : (
          <Group h={140} justify="center" bg="var(--mantine-color-default-hover)">
            <IconPhotoOff size={28} color="var(--mantine-color-dimmed)" />
          </Group>
        )}
      </Card.Section>

      <Stack gap="xs" h="100%" justify="space-between" pt="sm">
        <Stack gap={4}>
          <Group justify="space-between" align="flex-start" wrap="nowrap" gap="xs">
            <Text fw={600} lineClamp={2} c="var(--mantine-color-text)">
              {item.name}
            </Text>
            {capacity ? (
              <Badge variant="light" color="amber" style={{ flexShrink: 0 }}>
                {capacity}
              </Badge>
            ) : null}
          </Group>

          {subtitle ? (
            <Text size="sm" c="dimmed" lineClamp={1}>
              {subtitle}
            </Text>
          ) : null}
        </Stack>

        {/* The outside measurements, because the question a shelf answers is
            whether the box fits where it has to go. */}
        <Text size="xs" c="dimmed">
          {dimensions || 'bez wymiarów'}
        </Text>
      </Stack>
    </Card>
  )
}
