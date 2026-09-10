import { Badge, Card, Group, Image, Stack, Text } from '@mantine/core'
import { IconPhotoOff } from '@tabler/icons-react'
import { Link } from 'react-router-dom'

import { apiFileUrl } from '../../../api/client'
import type { ToolListItem } from '../../../api/types'
import { CONDITION_COLORS, CONDITION_LABELS, formatDateTime, toolSubtitle } from '../presentation'

// One tool, as it appears in the grid. A card rather than a table row on
// purpose: this list is read on a phone held in one hand, and a row that has to
// scroll sideways is a row nobody reads.
export function ToolCard({ tool }: { tool: ToolListItem }) {
  const subtitle = toolSubtitle(tool)

  return (
    <Card
      component={Link}
      to={`/tools/${tool.id}`}
      withBorder
      padding="md"
      radius="md"
      style={{ textDecoration: 'none' }}
    >
      <Card.Section>
        {/* Fixed height whether or not there is a photo: a grid where every
            other card is shorter is a grid nobody can scan. */}
        {tool.primaryPhotoUrl ? (
          <Image
            src={apiFileUrl(tool.primaryPhotoUrl)}
            alt={tool.name}
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
              {tool.name}
            </Text>
            <Badge
              color={CONDITION_COLORS[tool.condition]}
              variant="light"
              style={{ flexShrink: 0 }}
            >
              {CONDITION_LABELS[tool.condition]}
            </Badge>
          </Group>

          {subtitle ? (
            <Text size="sm" c="dimmed" lineClamp={1}>
              {subtitle}
            </Text>
          ) : null}
        </Stack>

        <Group justify="space-between" gap="xs" wrap="nowrap">
          {tool.category ? (
            <Badge variant="default" size="sm">
              {tool.category}
            </Badge>
          ) : (
            <Text size="xs" c="dimmed">
              bez kategorii
            </Text>
          )}
          <Text size="xs" c="dimmed">
            {formatDateTime(tool.updatedAt)}
          </Text>
        </Group>
      </Stack>
    </Card>
  )
}
