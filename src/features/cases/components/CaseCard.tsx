import { Badge, Card, Group, Image, Stack, Text } from '@mantine/core'
import { IconPhotoOff } from '@tabler/icons-react'
import { Link } from 'react-router-dom'

import { apiFileUrl } from '../../../api/client'
import type { ItemSummary } from '../../../api/types'
import { t } from '../../../i18n'
import { capacity, caseSubtitle, outerDimensions } from '../presentation'

// One case, as it appears in the grid. The same card shape as an item because
// it is the same card: a box is an item with `kind: "case"`, and this screen
// is the one that shows what a box states — the outside measurements and what
// goes in — which is why its list asks for the spec sheet.
export function CaseCard({ item }: { item: ItemSummary }) {
  const sheet = { attributes: item.attributes ?? [] }
  const subtitle = caseSubtitle(item)
  const dimensions = outerDimensions(sheet)
  const goesIn = capacity(sheet)

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
            {goesIn ? (
              <Badge variant="light" color="amber" style={{ flexShrink: 0 }}>
                {goesIn}
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
          {dimensions || t('bez wymiarów')}
        </Text>
      </Stack>
    </Card>
  )
}
